import { config } from "dotenv";
config({ path: ".env.local" });

import { and, eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { generateWeeklyOccurrences } from "../src/lib/calendar";

/**
 * Seeds a demo season + recurring practices for the Ali school (St-Laurent):
 *  - Beginners: Mon–Fri 09:00–15:00
 *  - Intermediate & Elite: Mon–Fri 18:00–20:00 (combined evening training)
 * Idempotent: skips if the season already has series.
 */
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  const db = drizzle(neon(process.env.DATABASE_URL), { schema });

  const SEASON_SLUG = "summer-2026";
  const SEASON_START = "2026-06-01";
  const SEASON_END = "2026-08-31";

  // Ali school is in St-Laurent.
  const [ali] = await db
    .select()
    .from(schema.practiceVenues)
    .where(eq(schema.practiceVenues.region, "St-Laurent"))
    .limit(1);
  if (!ali) throw new Error("Ali (St-Laurent) venue not found — run db:seed first.");

  let [season] = await db
    .select()
    .from(schema.seasons)
    .where(eq(schema.seasons.slug, SEASON_SLUG))
    .limit(1);

  if (!season) {
    [season] = await db
      .insert(schema.seasons)
      .values({
        name: "Summer 2026",
        slug: SEASON_SLUG,
        startDate: new Date(`${SEASON_START}T00:00:00Z`),
        endDate: new Date(`${SEASON_END}T00:00:00Z`),
      })
      .returning();
    console.log("Created season Summer 2026.");
  }

  const existing = await db
    .select()
    .from(schema.practiceSeries)
    .where(
      and(
        eq(schema.practiceSeries.seasonId, season.id),
        eq(schema.practiceSeries.venueId, ali.id),
      ),
    );
  if (existing.length > 0) {
    console.log("Ali series already seeded, skipping.");
    return;
  }

  const slots = [
    {
      title: "Beginners group",
      level: "beginner" as const,
      type: "class" as const,
      startTime: "09:00",
      endTime: "15:00",
    },
    {
      title: "Intermediate & Elite training",
      level: null,
      type: "class" as const,
      startTime: "18:00",
      endTime: "20:00",
    },
  ];

  const weekdays = [1, 2, 3, 4, 5]; // Mon–Fri
  let total = 0;

  for (const slot of slots) {
    for (const dayOfWeek of weekdays) {
      const [series] = await db
        .insert(schema.practiceSeries)
        .values({
          seasonId: season.id,
          venueId: ali.id,
          type: slot.type,
          level: slot.level,
          title: slot.title,
          dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          startDate: season.startDate,
          endDate: season.endDate,
        })
        .returning({ id: schema.practiceSeries.id });

      const occurrences = generateWeeklyOccurrences({
        dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        startDate: SEASON_START,
        endDate: SEASON_END,
      });

      if (occurrences.length > 0) {
        await db.insert(schema.scheduleEvents).values(
          occurrences.map((o) => ({
            type: slot.type,
            title: slot.title,
            venueId: ali.id,
            level: slot.level,
            seriesId: series.id,
            startsAt: o.startsAt,
            endsAt: o.endsAt,
          })),
        );
        total += occurrences.length;
      }
    }
  }

  console.log(`Seeded ${total} practices for Ali (St-Laurent), Summer 2026.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
