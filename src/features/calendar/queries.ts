import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  appUsers,
  fleetVehicles,
  practiceSeries,
  practiceVenues,
  scheduleEventCoaches,
  scheduleEvents,
  seasons,
  userRoles,
} from "@/db/schema";
import type { PlayerLevel } from "@/lib/roles";

export type AgendaCoach = { userId: string; name: string };

export type AgendaEvent = {
  id: string;
  title: string;
  type: string;
  level: PlayerLevel | null;
  startsAt: Date;
  endsAt: Date;
  canceled: boolean;
  notes: string | null;
  venueId: string;
  venueName: string;
  region: string;
  address: string;
  coaches: AgendaCoach[];
};

export type AgendaFilters = {
  from: Date;
  to: Date;
  level?: PlayerLevel;
  venueId?: string;
  limit?: number;
};

const AGENDA_LIMIT = 300;

/**
 * Windowed agenda: all practices between `from` and `to`, with venue and
 * assigned coaches. Two batched queries (events, then coaches by inArray) —
 * no per-event lookups.
 */
export async function getAgenda(filters: AgendaFilters): Promise<AgendaEvent[]> {
  const db = getDb();
  const conditions = [
    gte(scheduleEvents.startsAt, filters.from),
    lte(scheduleEvents.startsAt, filters.to),
  ];
  if (filters.level) conditions.push(eq(scheduleEvents.level, filters.level));
  if (filters.venueId) conditions.push(eq(scheduleEvents.venueId, filters.venueId));

  const events = await db
    .select({
      id: scheduleEvents.id,
      title: scheduleEvents.title,
      type: scheduleEvents.type,
      level: scheduleEvents.level,
      startsAt: scheduleEvents.startsAt,
      endsAt: scheduleEvents.endsAt,
      canceled: scheduleEvents.canceled,
      notes: scheduleEvents.notes,
      venueId: scheduleEvents.venueId,
      venueName: practiceVenues.name,
      region: practiceVenues.region,
      address: practiceVenues.address,
    })
    .from(scheduleEvents)
    .innerJoin(practiceVenues, eq(practiceVenues.id, scheduleEvents.venueId))
    .where(and(...conditions))
    .orderBy(asc(scheduleEvents.startsAt))
    .limit(filters.limit ?? AGENDA_LIMIT);

  if (events.length === 0) return [];

  const eventIds = events.map((e) => e.id);
  const coachRows = await db
    .select({
      eventId: scheduleEventCoaches.eventId,
      userId: appUsers.id,
      name: appUsers.displayName,
      email: appUsers.email,
    })
    .from(scheduleEventCoaches)
    .innerJoin(appUsers, eq(appUsers.id, scheduleEventCoaches.coachUserId))
    .where(inArray(scheduleEventCoaches.eventId, eventIds));

  const coachesByEvent = new Map<string, AgendaCoach[]>();
  for (const row of coachRows) {
    const list = coachesByEvent.get(row.eventId) ?? [];
    list.push({ userId: row.userId, name: row.name ?? row.email });
    coachesByEvent.set(row.eventId, list);
  }

  return events.map((e) => ({
    ...e,
    level: e.level as PlayerLevel | null,
    coaches: coachesByEvent.get(e.id) ?? [],
  }));
}

export async function getEventDetail(eventId: string) {
  const db = getDb();
  const [event] = await db
    .select({
      id: scheduleEvents.id,
      title: scheduleEvents.title,
      type: scheduleEvents.type,
      level: scheduleEvents.level,
      startsAt: scheduleEvents.startsAt,
      endsAt: scheduleEvents.endsAt,
      canceled: scheduleEvents.canceled,
      notes: scheduleEvents.notes,
      venueId: scheduleEvents.venueId,
      venueName: practiceVenues.name,
      region: practiceVenues.region,
      address: practiceVenues.address,
      requiresCar: practiceVenues.requiresCar,
      seriesId: scheduleEvents.seriesId,
    })
    .from(scheduleEvents)
    .innerJoin(practiceVenues, eq(practiceVenues.id, scheduleEvents.venueId))
    .where(eq(scheduleEvents.id, eventId))
    .limit(1);

  if (!event) return null;

  const coaches = await db
    .select({
      userId: appUsers.id,
      name: appUsers.displayName,
      email: appUsers.email,
    })
    .from(scheduleEventCoaches)
    .innerJoin(appUsers, eq(appUsers.id, scheduleEventCoaches.coachUserId))
    .where(eq(scheduleEventCoaches.eventId, eventId));

  return {
    ...event,
    level: event.level as PlayerLevel | null,
    coaches: coaches.map((c) => ({ userId: c.userId, name: c.name ?? c.email })),
  };
}

export async function listVenues() {
  const db = getDb();
  return db
    .select({
      id: practiceVenues.id,
      name: practiceVenues.name,
      region: practiceVenues.region,
      requiresCar: practiceVenues.requiresCar,
    })
    .from(practiceVenues)
    .orderBy(asc(practiceVenues.region), asc(practiceVenues.name));
}

export async function listSeasons() {
  const db = getDb();
  return db.select().from(seasons).orderBy(desc(seasons.startDate));
}

export async function listSeriesForSeason(seasonId: string) {
  const db = getDb();
  return db
    .select({
      id: practiceSeries.id,
      title: practiceSeries.title,
      level: practiceSeries.level,
      dayOfWeek: practiceSeries.dayOfWeek,
      startTime: practiceSeries.startTime,
      endTime: practiceSeries.endTime,
      active: practiceSeries.active,
      venueName: practiceVenues.name,
      region: practiceVenues.region,
    })
    .from(practiceSeries)
    .innerJoin(practiceVenues, eq(practiceVenues.id, practiceSeries.venueId))
    .where(eq(practiceSeries.seasonId, seasonId))
    .orderBy(asc(practiceSeries.dayOfWeek), asc(practiceSeries.startTime));
}

/** Coaches available for assignment (users with the coach role). */
export async function listCoaches() {
  const db = getDb();
  return db
    .selectDistinct({
      userId: appUsers.id,
      name: appUsers.displayName,
      email: appUsers.email,
    })
    .from(userRoles)
    .innerJoin(appUsers, eq(appUsers.id, userRoles.userId))
    .where(eq(userRoles.role, "coach"))
    .orderBy(asc(appUsers.displayName));
}

/** Cars a coach can take: available and charged. */
export async function listAvailableFleet() {
  const db = getDb();
  return db
    .select()
    .from(fleetVehicles)
    .where(and(eq(fleetVehicles.isAvailable, true), eq(fleetVehicles.isCharged, true)))
    .orderBy(asc(fleetVehicles.name));
}

/** Count of upcoming practices per series — used to show "generated" totals. */
export async function countUpcomingEventsForSeries(seriesIds: string[]) {
  if (seriesIds.length === 0) return new Map<string, number>();
  const db = getDb();
  const rows = await db
    .select({
      seriesId: scheduleEvents.seriesId,
      total: sql<number>`count(*)`,
    })
    .from(scheduleEvents)
    .where(inArray(scheduleEvents.seriesId, seriesIds))
    .groupBy(scheduleEvents.seriesId);
  return new Map(rows.map((r) => [r.seriesId as string, Number(r.total)]));
}
