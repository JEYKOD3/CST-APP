import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { count } from "drizzle-orm";
import * as schema from "../src/db/schema";

const VENUES = [
  {
    name: "Club Atwater",
    address: "3505 Avenue Atwater, Montréal, QC",
    region: "Westmount",
    requiresCar: false,
  },
  {
    name: "Sacred Heart School",
    address: "3635 Atwater Ave, Montréal, QC",
    region: "Westmount",
    requiresCar: false,
  },
  {
    name: "Brossard",
    address: "5905 Grande Allée, Brossard, QC",
    region: "Brossard",
    requiresCar: true,
  },
  {
    name: "Saint-Laurent",
    address: "1610 Rue de Beauharnois Ouest, Montréal, QC",
    region: "Saint-Laurent",
    requiresCar: true,
  },
] as const;

async function seed() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL missing — see SETUP.md");
  }

  const db = drizzle(neon(process.env.DATABASE_URL), { schema });
  const [existing] = await db.select({ count: count() }).from(schema.practiceVenues);

  if (existing.count > 0) {
    const venues = await db.select().from(schema.practiceVenues);
    const [eventCount] = await db
      .select({ count: count() })
      .from(schema.scheduleEvents);

    if (eventCount.count === 0 && venues.length > 0) {
      const atwater = venues.find((v) => v.region === "Westmount") ?? venues[0];
      const brossard = venues.find((v) => v.region === "Brossard") ?? venues[0];
      const start = new Date();
      start.setHours(9, 0, 0, 0);
      if (start < new Date()) start.setDate(start.getDate() + 1);

      const campEnd = new Date(start);
      campEnd.setHours(12, 0, 0, 0);

      const pmStart = new Date(start);
      pmStart.setHours(14, 0, 0, 0);
      const pmEnd = new Date(pmStart);
      pmEnd.setHours(16, 0, 0, 0);

      await db.insert(schema.scheduleEvents).values([
        {
          type: "camp",
          title: "Summer camp — morning",
          venueId: atwater.id,
          startsAt: start,
          endsAt: campEnd,
          notes: "All levels welcome. Master schedule syncs here.",
        },
        {
          type: "class",
          title: "Intermediate practice",
          venueId: brossard.id,
          startsAt: pmStart,
          endsAt: pmEnd,
          notes: "Car shuttle from Atwater if needed.",
        },
      ]);
      console.log("Seeded sample schedule events.");
    }

    console.log("Already seeded, skipping venues/fleet.");
    return;
  }

  await db.insert(schema.practiceVenues).values([...VENUES]);
  await db.insert(schema.fleetVehicles).values([
    { name: "Tesla Gray", color: "gray", currentLocation: "brossard", isCharged: true, isAvailable: true },
    { name: "Tesla Blue", color: "blue", currentLocation: "atwater", isCharged: true, isAvailable: true },
  ]);

  console.log("Seeded venues and fleet.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
