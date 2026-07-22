import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import { seedBrossardHours } from "../src/features/calendar/seed-brossard";

/**
 * Seeds Brossard group-training hours on the master calendar:
 *  Summer (today → Sep 30, 2026): Mon/Tue/Wed 8–10 PM, Sat 1:30–3:30 PM, Sun 1–3 PM
 *  Winter (Sep 1, 2026 → Feb 28, 2027): Sun 3:15–5:15 PM
 *
 * The same logic runs from the in-app admin action ("Load Brossard hours"),
 * so admins can populate the calendar from their phone without this script.
 * Idempotent — safe to run repeatedly.
 */
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing — see SETUP.md");
  const db = drizzle(neon(process.env.DATABASE_URL), { schema });

  const result = await seedBrossardHours(db);
  for (const line of result.details) console.log(line);
  console.log(
    `Done — ${result.created} Brossard practices created${result.skipped ? `, ${result.skipped} slot(s) already seeded` : ""}.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
