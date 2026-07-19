import type { PlayerLevel } from "@/lib/roles";

/** All CST venues are in the Montreal area. Times are wall-clock in this zone. */
export const CLUB_TIMEZONE = "America/Toronto";

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Safety ceiling so a bad date range can never generate unbounded rows. */
export const MAX_OCCURRENCES = 400;

export type Occurrence = { startsAt: Date; endsAt: Date };

/** Offset (in minutes) of `timeZone` at a given UTC instant. */
function tzOffsetMinutes(timeZone: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(at);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return (asUTC - at.getTime()) / 60000;
}

/**
 * Convert a wall-clock date+time in `timeZone` to the matching UTC instant.
 * `dateStr` = "YYYY-MM-DD", `timeStr` = "HH:MM".
 */
export function zonedTimeToUtc(
  dateStr: string,
  timeStr: string,
  timeZone: string = CLUB_TIMEZONE,
): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const utcGuess = Date.UTC(y, m - 1, d, hh, mm, 0);
  const offset = tzOffsetMinutes(timeZone, new Date(utcGuess));
  return new Date(utcGuess - offset * 60000);
}

/** Weekday (0=Sun..6=Sat) of a calendar date string, independent of local tz. */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function toDateString(y: number, m: number, d: number): string {
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

/**
 * All dated occurrences of a weekly slot between startDate and endDate
 * (inclusive), materialized as UTC instants. Pure — safe to unit test.
 */
export function generateWeeklyOccurrences(opts: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  timeZone?: string;
}): Occurrence[] {
  const { dayOfWeek, startTime, endTime, startDate, endDate } = opts;
  const timeZone = opts.timeZone ?? CLUB_TIMEZONE;

  const occurrences: Occurrence[] = [];
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);

  // Iterate day-by-day using a UTC calendar cursor (no DST drift on the date).
  let cursor = Date.UTC(sy, sm - 1, sd);
  const end = Date.UTC(ey, em - 1, ed);

  while (cursor <= end && occurrences.length < MAX_OCCURRENCES) {
    const c = new Date(cursor);
    if (c.getUTCDay() === dayOfWeek) {
      const dateStr = toDateString(
        c.getUTCFullYear(),
        c.getUTCMonth() + 1,
        c.getUTCDate(),
      );
      occurrences.push({
        startsAt: zonedTimeToUtc(dateStr, startTime, timeZone),
        endsAt: zonedTimeToUtc(dateStr, endTime, timeZone),
      });
    }
    cursor += 86_400_000; // +1 day
  }

  return occurrences;
}

export function formatLevel(level: PlayerLevel | null | undefined): string {
  if (!level) return "All levels";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/** Group key (YYYY-MM-DD in club tz) used to bucket events by calendar day. */
export function dayKey(date: Date, timeZone: string = CLUB_TIMEZONE): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return dtf.format(date); // en-CA → YYYY-MM-DD
}

export function formatDayHeading(date: Date, timeZone: string = CLUB_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatTimeRange(
  start: Date,
  end: Date,
  timeZone: string = CLUB_TIMEZONE,
): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

/** "HH:MM" (24h) wall-clock value for a time <input>, in the club tz. */
export function zonedTimeInput(date: Date, timeZone: string = CLUB_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return `${map.hour}:${map.minute}`;
}
