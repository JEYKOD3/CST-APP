import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  attendanceRecords,
  players,
  practiceVenues,
  scheduleEvents,
} from "@/db/schema";
import type { AttendanceStatus } from "@/lib/attendance";

const UPCOMING_LIMIT = 40;

type UpcomingEvent = {
  id: string;
  title: string;
  type: string;
  startsAt: Date;
  endsAt: Date;
  venueName: string;
  region: string;
};

async function listUpcomingEvents(limit = UPCOMING_LIMIT): Promise<UpcomingEvent[]> {
  const db = getDb();
  return db
    .select({
      id: scheduleEvents.id,
      title: scheduleEvents.title,
      type: scheduleEvents.type,
      startsAt: scheduleEvents.startsAt,
      endsAt: scheduleEvents.endsAt,
      venueName: practiceVenues.name,
      region: practiceVenues.region,
    })
    .from(scheduleEvents)
    .innerJoin(practiceVenues, eq(practiceVenues.id, scheduleEvents.venueId))
    .where(gte(scheduleEvents.endsAt, new Date()))
    .orderBy(asc(scheduleEvents.startsAt))
    .limit(limit);
}

export type ParentAttendanceChild = {
  playerId: string;
  firstName: string;
  lastName: string;
  status: AttendanceStatus;
};

export type ParentAttendanceEvent = UpcomingEvent & {
  children: ParentAttendanceChild[];
};

/**
 * Parent view: upcoming practices, each with this parent's active children and
 * their current attendance status. Batched — no per-event/per-child queries.
 */
export async function getParentAttendanceOverview(
  parentUserId: string,
): Promise<ParentAttendanceEvent[]> {
  const db = getDb();

  const children = await db
    .select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
    })
    .from(players)
    .where(and(eq(players.parentUserId, parentUserId), eq(players.active, true)))
    .orderBy(asc(players.firstName));

  if (children.length === 0) return [];

  const events = await listUpcomingEvents();
  if (events.length === 0) return [];

  const childIds = children.map((c) => c.id);
  const eventIds = events.map((e) => e.id);

  const records = await db
    .select({
      eventId: attendanceRecords.eventId,
      playerId: attendanceRecords.playerId,
      status: attendanceRecords.status,
    })
    .from(attendanceRecords)
    .where(
      and(
        inArray(attendanceRecords.eventId, eventIds),
        inArray(attendanceRecords.playerId, childIds),
      ),
    );

  const statusByKey = new Map<string, AttendanceStatus>();
  for (const r of records) {
    statusByKey.set(`${r.eventId}:${r.playerId}`, r.status);
  }

  return events.map((event) => ({
    ...event,
    children: children.map((child) => ({
      playerId: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      status: statusByKey.get(`${event.id}:${child.id}`) ?? "pending",
    })),
  }));
}

export type CoachPractice = UpcomingEvent & {
  confirmed: number;
  declined: number;
  finalized: number;
};

/**
 * Coach view: upcoming practices with aggregate response counts. Counts come
 * from a single grouped query, not one query per practice.
 */
export async function listCoachPractices(): Promise<CoachPractice[]> {
  const events = await listUpcomingEvents();
  if (events.length === 0) return [];

  const db = getDb();
  const eventIds = events.map((e) => e.id);

  const counts = await db
    .select({
      eventId: attendanceRecords.eventId,
      confirmed: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'parent_confirmed')`,
      declined: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'parent_absent')`,
      finalized: sql<number>`count(*) filter (where ${attendanceRecords.status} in ('present','absent'))`,
    })
    .from(attendanceRecords)
    .where(inArray(attendanceRecords.eventId, eventIds))
    .groupBy(attendanceRecords.eventId);

  const countByEvent = new Map(counts.map((c) => [c.eventId, c]));

  return events.map((event) => {
    const c = countByEvent.get(event.id);
    return {
      ...event,
      confirmed: Number(c?.confirmed ?? 0),
      declined: Number(c?.declined ?? 0),
      finalized: Number(c?.finalized ?? 0),
    };
  });
}

export type RosterRow = {
  playerId: string;
  firstName: string;
  lastName: string;
  level: string;
  status: AttendanceStatus;
  parentConfirmedAt: Date | null;
  coachFinalizedAt: Date | null;
};

export type EventRoster = {
  event: UpcomingEvent | null;
  rows: RosterRow[];
};

/** Coach detail: one practice's roster (all players with a record). */
export async function getEventRoster(eventId: string): Promise<EventRoster> {
  const db = getDb();

  const [event] = await db
    .select({
      id: scheduleEvents.id,
      title: scheduleEvents.title,
      type: scheduleEvents.type,
      startsAt: scheduleEvents.startsAt,
      endsAt: scheduleEvents.endsAt,
      venueName: practiceVenues.name,
      region: practiceVenues.region,
    })
    .from(scheduleEvents)
    .innerJoin(practiceVenues, eq(practiceVenues.id, scheduleEvents.venueId))
    .where(eq(scheduleEvents.id, eventId))
    .limit(1);

  if (!event) return { event: null, rows: [] };

  const rows = await db
    .select({
      playerId: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      level: players.level,
      status: attendanceRecords.status,
      parentConfirmedAt: attendanceRecords.parentConfirmedAt,
      coachFinalizedAt: attendanceRecords.coachFinalizedAt,
    })
    .from(attendanceRecords)
    .innerJoin(players, eq(players.id, attendanceRecords.playerId))
    .where(eq(attendanceRecords.eventId, eventId))
    .orderBy(asc(players.firstName), asc(players.lastName));

  return { event, rows };
}
