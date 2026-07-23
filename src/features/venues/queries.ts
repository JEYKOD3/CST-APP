import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { practiceVenues } from "@/db/schema";

/** All venues incl. inactive — for the venue management screen. */
export async function listAllVenues() {
  const db = getDb();
  return db
    .select({
      id: practiceVenues.id,
      name: practiceVenues.name,
      address: practiceVenues.address,
      region: practiceVenues.region,
      requiresCar: practiceVenues.requiresCar,
      active: practiceVenues.active,
    })
    .from(practiceVenues)
    .orderBy(asc(practiceVenues.region), asc(practiceVenues.name));
}
