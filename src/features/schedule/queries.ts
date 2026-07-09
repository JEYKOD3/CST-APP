import { asc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { practiceVenues, scheduleEvents } from "@/db/schema";

export async function listUpcomingScheduleEvents(limit = 50) {
  const db = getDb();
  const now = new Date();

  return db
    .select({
      id: scheduleEvents.id,
      title: scheduleEvents.title,
      type: scheduleEvents.type,
      startsAt: scheduleEvents.startsAt,
      endsAt: scheduleEvents.endsAt,
      notes: scheduleEvents.notes,
      venueName: practiceVenues.name,
      venueAddress: practiceVenues.address,
      region: practiceVenues.region,
    })
    .from(scheduleEvents)
    .innerJoin(practiceVenues, eq(practiceVenues.id, scheduleEvents.venueId))
    .where(gte(scheduleEvents.endsAt, now))
    .orderBy(asc(scheduleEvents.startsAt))
    .limit(limit);
}
