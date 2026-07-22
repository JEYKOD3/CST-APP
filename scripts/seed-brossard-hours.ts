import { config } from "dotenv";
config({ path: ".env.local" });

import { and, eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import {
  BROSSARD_SEASONS,
  BROSSARD_TRAINING_SLOTS,
  occurrencesForSlot,
  slotStartDate,
} from "../src/features/calendar/brossard-hours";
import { CLUB_TIMEZONE, WEEKDAYS } from "../src/lib/calendar";

/**
 * Seeds Brossard group-training hours on the master calendar:
 *  Summer (today → Sep 30, 2026): Mon/Tue/Wed 8–10 PM, Sat 1:30–3:30 PM, Sun 1–3 PM
 *  Winter (Sep 1, 2026 → Feb 28, 2027): Sun 3:15–5:15 PM
 *
 * Idempotent: a slot is skipped when a series with the same season, venue,
 * weekday, start and end time already exists. Only future practices are
 * created (never before today's date in club time).
 */
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing — see SETUP.md");
  const db = drizzle(neon(process.env.DATABASE_URL), { schema });

  const [brossard] = await db
    .select()
    .from(schema.practiceVenues)
    .where(eq(schema.practiceVenues.region, "Brossard"))
    .limit(1);
  if (!brossard) throw new Error("Brossard venue not found — run db:seed first.");

  // "Today" in club wall-clock time so evening runs don't skip today's practice.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

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
        })
        .returning();
      console.log(`Created season ${season.name}.`);
    }
    seasonIds.set(season.slug, row.id);
  }

  let created = 0;
  let skipped = 0;

  for (const slot of BROSSARD_TRAINING_SLOTS) {
    const season = BROSSARD_SEASONS[slot.season];
    const seasonId = seasonIds.get(season.slug)!;

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
      console.log(
        `Skip ${season.name} ${WEEKDAYS[slot.dayOfWeek]} ${slot.startTime}–${slot.endTime} (already seeded).`,
      );
      skipped++;
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
        })),
      );
    }

    console.log(
      `Seeded ${season.name} ${WEEKDAYS[slot.dayOfWeek]} ${slot.startTime}–${slot.endTime}: ${occurrences.length} practices.`,
    );
    created += occurrences.length;
  }

  console.log(
    `Done — ${created} Brossard practices created${skipped ? `, ${skipped} slot(s) already seeded` : ""}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
