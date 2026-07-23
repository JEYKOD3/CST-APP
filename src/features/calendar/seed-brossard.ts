import { and, eq } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";
import {
  BROSSARD_SEASONS,
  BROSSARD_TRAINING_SLOTS,
  occurrencesForSlot,
  slotStartDate,
} from "@/features/calendar/brossard-hours";
import { CLUB_TIMEZONE, WEEKDAYS } from "@/lib/calendar";

type Db = NeonHttpDatabase<typeof schema>;

export type BrossardSeedResult = {
  created: number;
  skipped: number;
  details: string[];
};

/** Today's calendar date (YYYY-MM-DD) in club wall-clock time. */
export function clubToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Populate the Brossard training hours on the master calendar. Shared by the
 * CLI seed script and the in-app admin action so both stay in sync.
 *
 * Idempotent: a slot is skipped when a series with the same season, venue,
 * weekday, start and end time already exists. Only future practices are
 * created (never before `today`).
 */
export async function seedBrossardHours(
  db: Db,
  today: string = clubToday(),
  opts: { createdByUserId?: string } = {},
): Promise<BrossardSeedResult> {
  const [brossard] = await db
    .select()
    .from(schema.practiceVenues)
    .where(eq(schema.practiceVenues.region, "Brossard"))
    .limit(1);
  if (!brossard) {
    throw new Error("Brossard venue not found — run db:seed first.");
  }

  const seasonIds = new Map<string, string>();
  for (const season of Object.values(BROSSARD_SEASONS)) {
    let [row] = await db
      .select()
      .from(schema.seasons)
      .where(eq(schema.seasons.slug, season.slug))
      .limit(1);

    if (!row) {
      [row] = await db
        .insert(schema.seasons)
        .values({
          name: season.name,
          slug: season.slug,
          startDate: new Date(`${season.startDate}T00:00:00Z`),
          endDate: new Date(`${season.endDate}T00:00:00Z`),
          createdByUserId: opts.createdByUserId,
        })
        .returning();
    }
    seasonIds.set(season.slug, row.id);
  }

  let created = 0;
  let skipped = 0;
  const details: string[] = [];

  for (const slot of BROSSARD_TRAINING_SLOTS) {
    const season = BROSSARD_SEASONS[slot.season];
    const seasonId = seasonIds.get(season.slug)!;
    const label = `${season.name} ${WEEKDAYS[slot.dayOfWeek]} ${slot.startTime}–${slot.endTime}`;

    const [existing] = await db
      .select({ id: schema.practiceSeries.id })
      .from(schema.practiceSeries)
      .where(
        and(
          eq(schema.practiceSeries.seasonId, seasonId),
          eq(schema.practiceSeries.venueId, brossard.id),
          eq(schema.practiceSeries.dayOfWeek, slot.dayOfWeek),
          eq(schema.practiceSeries.startTime, slot.startTime),
          eq(schema.practiceSeries.endTime, slot.endTime),
        ),
      )
      .limit(1);

    if (existing) {
      skipped++;
      details.push(`Skip ${label} (already there).`);
      continue;
    }

    const startDate = slotStartDate(slot, today);
    const occurrences = occurrencesForSlot(slot, today);

    const [series] = await db
      .insert(schema.practiceSeries)
      .values({
        seasonId,
        venueId: brossard.id,
        type: "class",
        level: null, // all levels
        title: slot.title,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        startDate: new Date(`${startDate}T00:00:00Z`),
        endDate: new Date(`${season.endDate}T00:00:00Z`),
        createdByUserId: opts.createdByUserId,
      })
      .returning({ id: schema.practiceSeries.id });

    if (occurrences.length > 0) {
      await db.insert(schema.scheduleEvents).values(
        occurrences.map((o) => ({
          type: "class" as const,
          title: slot.title,
          venueId: brossard.id,
          level: null,
          seriesId: series.id,
          startsAt: o.startsAt,
          endsAt: o.endsAt,
          createdByUserId: opts.createdByUserId,
        })),
      );
    }

    created += occurrences.length;
    details.push(`Seeded ${label}: ${occurrences.length} practices.`);
  }

  return { created, skipped, details };
}
