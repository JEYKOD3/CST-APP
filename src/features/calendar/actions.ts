"use server";

import { and, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import {
  attendanceRecords,
  players,
  practiceSeries,
  practiceVenues,
  scheduleEventCoaches,
  scheduleEvents,
  seasons,
  seasonVenues,
} from "@/db/schema";
import { ensureAppUser } from "@/lib/auth";
import {
  dayKey,
  formatDayHeading,
  formatLevel,
  formatTimeRange,
  generateWeeklyOccurrences,
  WEEKDAYS,
  zonedTimeToUtc,
} from "@/lib/calendar";
import {
  canManageSchedule,
  canManageTeam,
  PLAYER_LEVELS,
  type PlayerLevel,
} from "@/lib/roles";
import { notifyAllUsers, notifyUsers } from "@/features/notifications/create";
import { clubToday, seedBrossardHours } from "@/features/calendar/seed-brossard";

type ActionResult = { ok?: boolean; error?: string; message?: string };

const SESSION_TYPES = ["class", "camp", "private", "elite"] as const;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseLevel(value: string): PlayerLevel | null {
  return (PLAYER_LEVELS as readonly string[]).includes(value)
    ? (value as PlayerLevel)
    : null;
}

/** Recipients affected by a change: confirmed/declined parents + assigned coaches. */
async function getEventAudience(eventId: string): Promise<string[]> {
  const db = getDb();
  const parentRows = await db
    .select({ parentUserId: players.parentUserId })
    .from(attendanceRecords)
    .innerJoin(players, eq(players.id, attendanceRecords.playerId))
    .where(eq(attendanceRecords.eventId, eventId));

  const coachRows = await db
    .select({ coachUserId: scheduleEventCoaches.coachUserId })
    .from(scheduleEventCoaches)
    .where(eq(scheduleEventCoaches.eventId, eventId));

  const ids: string[] = [];
  for (const r of parentRows) if (r.parentUserId) ids.push(r.parentUserId);
  for (const r of coachRows) ids.push(r.coachUserId);
  return ids;
}

export async function createSeason(formData: FormData): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can create seasons." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  if (!name || !startDate || !endDate) {
    return { error: "Name, start date and end date are required." };
  }
  if (startDate > endDate) {
    return { error: "End date must be after the start date." };
  }

  const venueIds = formData
    .getAll("venueIds")
    .map((v) => String(v))
    .filter(Boolean);

  const db = getDb();
  const [season] = await db
    .insert(seasons)
    .values({
      name,
      slug: slugify(name) || `season-${Date.now()}`,
      startDate: new Date(`${startDate}T00:00:00Z`),
      endDate: new Date(`${endDate}T00:00:00Z`),
      createdByUserId: user.id,
    })
    .returning({ id: seasons.id });

  if (venueIds.length > 0) {
    await db
      .insert(seasonVenues)
      .values(venueIds.map((venueId) => ({ seasonId: season.id, venueId })));
  }

  revalidatePath("/schedule/manage");
  return {
    ok: true,
    message: `Season "${name}" created${venueIds.length ? ` with ${venueIds.length} venue(s)` : ""}.`,
  };
}

/** Edit a season's name and date range. Does not re-materialize practices. */
export async function updateSeason(formData: FormData): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can edit seasons." };
  }

  const seasonId = String(formData.get("seasonId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  if (!seasonId || !name || !startDate || !endDate) {
    return { error: "Name, start date and end date are required." };
  }
  if (startDate > endDate) {
    return { error: "End date must be after the start date." };
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: seasons.id, active: seasons.active })
    .from(seasons)
    .where(eq(seasons.id, seasonId))
    .limit(1);
  if (!existing) return { error: "Season not found." };
  if (!existing.active) return { error: "This season is archived." };

  await db
    .update(seasons)
    .set({
      name,
      slug: slugify(name) || `season-${Date.now()}`,
      startDate: new Date(`${startDate}T00:00:00Z`),
      endDate: new Date(`${endDate}T00:00:00Z`),
    })
    .where(eq(seasons.id, seasonId));

  revalidatePath("/schedule/manage");
  return { ok: true, message: `Season "${name}" updated.` };
}

/**
 * Archive a season: keep all past practices in the DB, remove upcoming ones
 * for every slot/venue in the season, mark series + season inactive, notify
 * everyone.
 */
export async function archiveSeason(formData: FormData): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can archive seasons." };
  }

  const seasonId = String(formData.get("seasonId") ?? "");
  if (!seasonId) return { error: "Missing season." };

  const db = getDb();
  const [season] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.id, seasonId))
    .limit(1);
  if (!season) return { error: "Season not found." };
  if (!season.active) return { error: "This season is already archived." };

  const seriesRows = await db
    .select({ id: practiceSeries.id })
    .from(practiceSeries)
    .where(eq(practiceSeries.seasonId, seasonId));
  const seriesIds = seriesRows.map((s) => s.id);

  let removed = 0;
  if (seriesIds.length > 0) {
    for (const seriesId of seriesIds) {
      const deleted = await db
        .delete(scheduleEvents)
        .where(
          and(
            eq(scheduleEvents.seriesId, seriesId),
            gte(scheduleEvents.startsAt, new Date()),
          ),
        )
        .returning({ id: scheduleEvents.id });
      removed += deleted.length;
    }
    await db
      .update(practiceSeries)
      .set({ active: false })
      .where(eq(practiceSeries.seasonId, seasonId));
  }

  await db
    .update(seasons)
    .set({ active: false })
    .where(eq(seasons.id, seasonId));

  await notifyAllUsers({
    type: "practice_canceled",
    title: `Season archived: ${season.name}`,
    body: `Upcoming practices for this season were removed. Past practices stay on the calendar for records.`,
  });

  revalidatePath("/schedule");
  revalidatePath("/schedule/manage");
  return {
    ok: true,
    message: `Season archived. Removed ${removed} upcoming practice(s). Past ones kept. Everyone was notified.`,
  };
}

/**
 * Super admin only: permanently delete a season.
 * Upcoming practices are removed; past practices stay in the DB (their series
 * link is cleared when the season cascades). Everyone is notified.
 */
export async function deleteSeason(formData: FormData): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageTeam(user.roles)) {
    return { error: "Only super admins can delete a whole season." };
  }

  const seasonId = String(formData.get("seasonId") ?? "");
  if (!seasonId) return { error: "Missing season." };

  const db = getDb();
  const [season] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.id, seasonId))
    .limit(1);
  if (!season) return { error: "Season not found." };

  const seriesRows = await db
    .select({ id: practiceSeries.id })
    .from(practiceSeries)
    .where(eq(practiceSeries.seasonId, seasonId));

  let removed = 0;
  for (const { id: seriesId } of seriesRows) {
    const deleted = await db
      .delete(scheduleEvents)
      .where(
        and(
          eq(scheduleEvents.seriesId, seriesId),
          gte(scheduleEvents.startsAt, new Date()),
        ),
      )
      .returning({ id: scheduleEvents.id });
    removed += deleted.length;
  }

  // Deleting the season cascades practice_series + season_venues; past
  // schedule_events keep their rows with series_id set to null.
  await db.delete(seasons).where(eq(seasons.id, seasonId));

  await notifyAllUsers({
    type: "practice_canceled",
    title: `Season deleted: ${season.name}`,
    body: `This season was removed. Upcoming practices are gone; past practices remain for records.`,
  });

  revalidatePath("/schedule");
  revalidatePath("/schedule/manage");
  return {
    ok: true,
    message: `Season deleted. Removed ${removed} upcoming practice(s). Past ones kept. Everyone was notified.`,
  };
}

/** Replace the set of venues attributed to a season. */
export async function setSeasonVenues(formData: FormData): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can change season venues." };
  }

  const seasonId = String(formData.get("seasonId") ?? "");
  if (!seasonId) return { error: "Missing season." };
  const venueIds = formData
    .getAll("venueIds")
    .map((v) => String(v))
    .filter(Boolean);

  const db = getDb();
  const [season] = await db
    .select({ id: seasons.id })
    .from(seasons)
    .where(eq(seasons.id, seasonId))
    .limit(1);
  if (!season) return { error: "Season not found." };

  await db.delete(seasonVenues).where(eq(seasonVenues.seasonId, seasonId));
  if (venueIds.length > 0) {
    await db
      .insert(seasonVenues)
      .values(venueIds.map((venueId) => ({ seasonId, venueId })));
  }

  revalidatePath("/schedule/manage");
  return {
    ok: true,
    message: `Season venues updated (${venueIds.length}).`,
  };
}

/**
 * One-tap loader for the fixed Brossard training hours (Summer + Winter).
 * Runs the shared seeding logic server-side so admins can populate the
 * calendar from their phone. Idempotent — safe to tap repeatedly.
 */
export async function loadBrossardHours(): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can load the Brossard schedule." };
  }

  const db = getDb();
  let result;
  try {
    result = await seedBrossardHours(db, clubToday(), { createdByUserId: user.id });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not load Brossard hours.",
    };
  }

  revalidatePath("/schedule");
  revalidatePath("/schedule/manage");

  const message =
    result.created > 0
      ? `Added ${result.created} Brossard practices${result.skipped ? `, ${result.skipped} slot(s) already there` : ""}.`
      : `Brossard hours already loaded — ${result.skipped} slot(s), nothing to add.`;
  return { ok: true, message };
}

/**
 * Create a weekly recurring slot for one or more weekdays and materialize every
 * dated occurrence into schedule_events. One series row per selected weekday.
 */
export async function createSeriesAndGenerate(
  formData: FormData,
): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can create practices." };
  }

  const seasonId = String(formData.get("seasonId") ?? "");
  const venueId = String(formData.get("venueId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "class");
  const level = parseLevel(String(formData.get("level") ?? ""));
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const days = formData.getAll("days").map((d) => Number(d));

  if (!seasonId || !venueId || !title || !startTime || !endTime) {
    return { error: "Venue, title, time and at least one weekday are required." };
  }
  if (days.length === 0 || days.some((d) => Number.isNaN(d) || d < 0 || d > 6)) {
    return { error: "Select at least one valid weekday." };
  }
  if (startTime >= endTime) {
    return { error: "End time must be after the start time." };
  }
  if (!(SESSION_TYPES as readonly string[]).includes(type)) {
    return { error: "Invalid session type." };
  }

  const db = getDb();
  const [season] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.id, seasonId))
    .limit(1);
  if (!season) return { error: "Season not found." };

  const [attributed] = await db
    .select({ id: seasonVenues.id })
    .from(seasonVenues)
    .where(
      and(
        eq(seasonVenues.seasonId, seasonId),
        eq(seasonVenues.venueId, venueId),
      ),
    )
    .limit(1);
  if (!attributed) {
    return {
      error:
        "That venue isn't attributed to this season. Add it to the season's venues first.",
    };
  }

  const startDateStr = season.startDate.toISOString().slice(0, 10);
  const endDateStr = season.endDate.toISOString().slice(0, 10);

  let totalGenerated = 0;

  for (const dayOfWeek of days) {
    const [series] = await db
      .insert(practiceSeries)
      .values({
        seasonId,
        venueId,
        type: type as (typeof SESSION_TYPES)[number],
        level,
        title,
        dayOfWeek,
        startTime,
        endTime,
        startDate: season.startDate,
        endDate: season.endDate,
        createdByUserId: user.id,
      })
      .returning({ id: practiceSeries.id });

    const occurrences = generateWeeklyOccurrences({
      dayOfWeek,
      startTime,
      endTime,
      startDate: startDateStr,
      endDate: endDateStr,
    });

    if (occurrences.length > 0) {
      await db.insert(scheduleEvents).values(
        occurrences.map((o) => ({
          type: type as (typeof SESSION_TYPES)[number],
          title,
          venueId,
          level,
          seriesId: series.id,
          startsAt: o.startsAt,
          endsAt: o.endsAt,
          createdByUserId: user.id,
        })),
      );
      totalGenerated += occurrences.length;
    }
  }

  if (totalGenerated > 0) {
    const [venue] = await db
      .select({ name: practiceVenues.name })
      .from(practiceVenues)
      .where(eq(practiceVenues.id, venueId))
      .limit(1);
    const dayNames = days.map((d) => WEEKDAYS[d]).join(", ");
    await notifyAllUsers({
      type: "practice_created",
      title: `New practices added: ${title}`,
      body: `${venue?.name ?? "A venue"} — ${dayNames}, ${startTime}–${endTime} (${formatLevel(level)}).`,
    });
  }

  revalidatePath("/schedule");
  revalidatePath("/schedule/manage");
  return {
    ok: true,
    message: `Generated ${totalGenerated} practices across ${days.length} weekday(s). Everyone was notified.`,
  };
}

export async function createSinglePractice(
  formData: FormData,
): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can add practices." };
  }

  const venueId = String(formData.get("venueId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "class");
  const level = parseLevel(String(formData.get("level") ?? ""));
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!venueId || !title || !date || !startTime || !endTime) {
    return { error: "Venue, title, date and time are required." };
  }
  if (startTime >= endTime) {
    return { error: "End time must be after the start time." };
  }

  const db = getDb();
  const startsAt = zonedTimeToUtc(date, startTime);
  const endsAt = zonedTimeToUtc(date, endTime);
  await db.insert(scheduleEvents).values({
    type: type as (typeof SESSION_TYPES)[number],
    title,
    venueId,
    level,
    startsAt,
    endsAt,
    notes,
    createdByUserId: user.id,
  });

  const [venue] = await db
    .select({ name: practiceVenues.name })
    .from(practiceVenues)
    .where(eq(practiceVenues.id, venueId))
    .limit(1);
  await notifyAllUsers({
    type: "practice_created",
    title: `New practice: ${title}`,
    body: `${formatDayHeading(startsAt)}, ${formatTimeRange(startsAt, endsAt)} at ${venue?.name ?? "the venue"}.`,
  });

  revalidatePath("/schedule");
  return { ok: true, message: "Practice added and everyone notified." };
}

export async function updatePractice(formData: FormData): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can edit practices." };
  }

  const eventId = String(formData.get("eventId") ?? "");
  const venueId = String(formData.get("venueId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!eventId || !venueId || !date || !startTime || !endTime) {
    return { error: "All fields are required." };
  }
  if (startTime >= endTime) {
    return { error: "End time must be after the start time." };
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(scheduleEvents)
    .where(eq(scheduleEvents.id, eventId))
    .limit(1);
  if (!existing) return { error: "Practice not found." };

  const startsAt = zonedTimeToUtc(date, startTime);
  const endsAt = zonedTimeToUtc(date, endTime);

  const venueChanged = existing.venueId !== venueId;
  const timeChanged =
    existing.startsAt.getTime() !== startsAt.getTime() ||
    existing.endsAt.getTime() !== endsAt.getTime();

  await db
    .update(scheduleEvents)
    .set({ venueId, startsAt, endsAt, notes, updatedAt: new Date() })
    .where(eq(scheduleEvents.id, eventId));

  if (venueChanged || timeChanged) {
    const [venue] = await db
      .select({ name: practiceVenues.name })
      .from(practiceVenues)
      .where(eq(practiceVenues.id, venueId))
      .limit(1);
    const audience = await getEventAudience(eventId);
    await notifyUsers({
      userIds: audience,
      type: "practice_updated",
      title: `Schedule change: ${existing.title}`,
      body: `Now ${formatDayHeading(startsAt)}, ${formatTimeRange(startsAt, endsAt)} at ${venue?.name ?? "the venue"}.`,
      relatedEventId: eventId,
    });
  }

  revalidatePath("/schedule");
  revalidatePath(`/schedule/${eventId}`);
  return { ok: true, message: "Practice updated." };
}

export async function cancelPractice(formData: FormData): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can cancel practices." };
  }

  const eventId = String(formData.get("eventId") ?? "");
  if (!eventId) return { error: "Missing practice." };

  const db = getDb();
  const [existing] = await db
    .select()
    .from(scheduleEvents)
    .where(eq(scheduleEvents.id, eventId))
    .limit(1);
  if (!existing) return { error: "Practice not found." };

  await db
    .update(scheduleEvents)
    .set({ canceled: true, updatedAt: new Date() })
    .where(eq(scheduleEvents.id, eventId));

  const audience = await getEventAudience(eventId);
  await notifyUsers({
    userIds: audience,
    type: "practice_canceled",
    title: `Canceled: ${existing.title}`,
    body: `The ${formatDayHeading(existing.startsAt)} session was canceled.`,
    relatedEventId: eventId,
  });

  revalidatePath("/schedule");
  revalidatePath(`/schedule/${eventId}`);
  return { ok: true, message: "Practice canceled and everyone notified." };
}

export async function assignCoach(formData: FormData): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can assign coaches." };
  }

  const eventId = String(formData.get("eventId") ?? "");
  const coachUserId = String(formData.get("coachUserId") ?? "");
  if (!eventId || !coachUserId) return { error: "Missing coach or practice." };

  const db = getDb();
  const [event] = await db
    .select()
    .from(scheduleEvents)
    .where(eq(scheduleEvents.id, eventId))
    .limit(1);
  if (!event) return { error: "Practice not found." };

  const [already] = await db
    .select()
    .from(scheduleEventCoaches)
    .where(
      and(
        eq(scheduleEventCoaches.eventId, eventId),
        eq(scheduleEventCoaches.coachUserId, coachUserId),
      ),
    )
    .limit(1);

  if (already) return { error: "That coach is already assigned." };

  await db.insert(scheduleEventCoaches).values({ eventId, coachUserId });

  await notifyUsers({
    userIds: [coachUserId],
    type: "coach_assigned",
    title: `You're assigned: ${event.title}`,
    body: `${formatDayHeading(event.startsAt)}, ${formatTimeRange(event.startsAt, event.endsAt)}.`,
    relatedEventId: eventId,
  });

  revalidatePath(`/schedule/${eventId}`);
  revalidatePath("/schedule");
  return { ok: true, message: "Coach assigned and notified." };
}

export async function unassignCoach(formData: FormData): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can change coach assignments." };
  }

  const eventId = String(formData.get("eventId") ?? "");
  const coachUserId = String(formData.get("coachUserId") ?? "");
  if (!eventId || !coachUserId) return { error: "Missing coach or practice." };

  const db = getDb();
  await db
    .delete(scheduleEventCoaches)
    .where(
      and(
        eq(scheduleEventCoaches.eventId, eventId),
        eq(scheduleEventCoaches.coachUserId, coachUserId),
      ),
    );

  revalidatePath(`/schedule/${eventId}`);
  revalidatePath("/schedule");
  return { ok: true, message: "Coach removed." };
}

/**
 * Edit a recurring slot (venue / level / hours / title) for a whole season and
 * push the change to every UPCOMING generated practice, leaving past practices
 * untouched as historical record. Everyone in the system is notified.
 */
export async function updateSeries(formData: FormData): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can edit practice slots." };
  }

  const seriesId = String(formData.get("seriesId") ?? "");
  const venueId = String(formData.get("venueId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const level = parseLevel(String(formData.get("level") ?? ""));
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (!seriesId || !venueId || !title || !startTime || !endTime) {
    return { error: "Venue, title and time are required." };
  }
  if (startTime >= endTime) {
    return { error: "End time must be after the start time." };
  }

  const db = getDb();
  const [series] = await db
    .select()
    .from(practiceSeries)
    .where(eq(practiceSeries.id, seriesId))
    .limit(1);
  if (!series) return { error: "Practice slot not found." };

  const [attributed] = await db
    .select({ id: seasonVenues.id })
    .from(seasonVenues)
    .where(
      and(
        eq(seasonVenues.seasonId, series.seasonId),
        eq(seasonVenues.venueId, venueId),
      ),
    )
    .limit(1);
  if (!attributed) {
    return {
      error:
        "That venue isn't attributed to this season. Add it to the season's venues first.",
    };
  }

  await db
    .update(practiceSeries)
    .set({ venueId, level, title, startTime, endTime })
    .where(eq(practiceSeries.id, seriesId));

  // Re-time and re-venue every upcoming occurrence in place (keep their dates).
  const upcoming = await db
    .select({ id: scheduleEvents.id, startsAt: scheduleEvents.startsAt })
    .from(scheduleEvents)
    .where(
      and(
        eq(scheduleEvents.seriesId, seriesId),
        gte(scheduleEvents.startsAt, new Date()),
        eq(scheduleEvents.canceled, false),
      ),
    );

  for (const ev of upcoming) {
    const dateStr = dayKey(ev.startsAt);
    await db
      .update(scheduleEvents)
      .set({
        venueId,
        level,
        title,
        startsAt: zonedTimeToUtc(dateStr, startTime),
        endsAt: zonedTimeToUtc(dateStr, endTime),
        updatedAt: new Date(),
      })
      .where(eq(scheduleEvents.id, ev.id));
  }

  const [venue] = await db
    .select({ name: practiceVenues.name })
    .from(practiceVenues)
    .where(eq(practiceVenues.id, venueId))
    .limit(1);
  await notifyAllUsers({
    type: "practice_updated",
    title: `Schedule updated: ${title}`,
    body: `${WEEKDAYS[series.dayOfWeek]} practices are now ${startTime}–${endTime} at ${venue?.name ?? "the venue"} (${formatLevel(level)}).`,
  });

  revalidatePath("/schedule");
  revalidatePath("/schedule/manage");
  return {
    ok: true,
    message: `Updated ${upcoming.length} upcoming practice(s). Everyone was notified.`,
  };
}

/**
 * Delete all future occurrences of a series (e.g. slot discontinued), keeping
 * past practices in the database for records. Everyone is notified.
 */
export async function deleteFutureSeriesOccurrences(
  formData: FormData,
): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can edit series." };
  }
  const seriesId = String(formData.get("seriesId") ?? "");
  if (!seriesId) return { error: "Missing series." };

  const db = getDb();
  const [series] = await db
    .select()
    .from(practiceSeries)
    .where(eq(practiceSeries.id, seriesId))
    .limit(1);
  if (!series) return { error: "Practice slot not found." };

  const removed = await db
    .delete(scheduleEvents)
    .where(
      and(
        eq(scheduleEvents.seriesId, seriesId),
        gte(scheduleEvents.startsAt, new Date()),
      ),
    )
    .returning({ id: scheduleEvents.id });
  await db
    .update(practiceSeries)
    .set({ active: false })
    .where(eq(practiceSeries.id, seriesId));

  const [venue] = await db
    .select({ name: practiceVenues.name })
    .from(practiceVenues)
    .where(eq(practiceVenues.id, series.venueId))
    .limit(1);
  await notifyAllUsers({
    type: "practice_canceled",
    title: `Practices removed: ${series.title}`,
    body: `${WEEKDAYS[series.dayOfWeek]} ${series.startTime}–${series.endTime} at ${venue?.name ?? "the venue"} is discontinued for the rest of the season.`,
  });

  revalidatePath("/schedule");
  revalidatePath("/schedule/manage");
  return {
    ok: true,
    message: `Removed ${removed.length} upcoming practice(s). Past ones are kept. Everyone was notified.`,
  };
}
