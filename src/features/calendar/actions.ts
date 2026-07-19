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
} from "@/db/schema";
import { ensureAppUser } from "@/lib/auth";
import {
  formatDayHeading,
  formatTimeRange,
  generateWeeklyOccurrences,
  zonedTimeToUtc,
} from "@/lib/calendar";
import { canManageSchedule, PLAYER_LEVELS, type PlayerLevel } from "@/lib/roles";
import { notifyUsers } from "@/features/notifications/create";

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

  const db = getDb();
  await db.insert(seasons).values({
    name,
    slug: slugify(name) || `season-${Date.now()}`,
    startDate: new Date(`${startDate}T00:00:00Z`),
    endDate: new Date(`${endDate}T00:00:00Z`),
    createdByUserId: user.id,
  });

  revalidatePath("/schedule/manage");
  return { ok: true, message: `Season "${name}" created.` };
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

  revalidatePath("/schedule");
  revalidatePath("/schedule/manage");
  return {
    ok: true,
    message: `Generated ${totalGenerated} practices across ${days.length} weekday(s).`,
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
  await db.insert(scheduleEvents).values({
    type: type as (typeof SESSION_TYPES)[number],
    title,
    venueId,
    level,
    startsAt: zonedTimeToUtc(date, startTime),
    endsAt: zonedTimeToUtc(date, endTime),
    notes,
    createdByUserId: user.id,
  });

  revalidatePath("/schedule");
  return { ok: true, message: "Practice added." };
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

/** Delete all future occurrences of a series (e.g. slot discontinued). */
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
  await db
    .delete(scheduleEvents)
    .where(
      and(
        eq(scheduleEvents.seriesId, seriesId),
        gte(scheduleEvents.startsAt, new Date()),
      ),
    );
  await db
    .update(practiceSeries)
    .set({ active: false })
    .where(eq(practiceSeries.id, seriesId));

  revalidatePath("/schedule");
  revalidatePath("/schedule/manage");
  return { ok: true, message: "Future occurrences removed." };
}
