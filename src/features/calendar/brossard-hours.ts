import { generateWeeklyOccurrences, type Occurrence } from "@/lib/calendar";

/**
 * Brossard training hours (provided by the club, 2026-07-22):
 *
 * Summer (until end of September 2026)
 *   Mon / Tue / Wed  8:00–10:00 PM
 *   Saturday         1:30–3:30 PM
 *   Sunday           1:00–3:00 PM
 *
 * Winter (September 2026 → February 2027)
 *   Sunday           3:15–5:15 PM
 */
export const BROSSARD_SEASONS = {
  summer: {
    name: "Summer 2026",
    slug: "summer-2026",
    startDate: "2026-06-01",
    endDate: "2026-09-30",
  },
  winter: {
    name: "Winter 2026-27",
    slug: "winter-2026-27",
    startDate: "2026-09-01",
    endDate: "2027-02-28",
  },
} as const;

export type BrossardSeasonKey = keyof typeof BROSSARD_SEASONS;

export type BrossardSlot = {
  season: BrossardSeasonKey;
  title: string;
  /** 0=Sunday .. 6=Saturday */
  dayOfWeek: number;
  /** "HH:MM" wall-clock at the venue (America/Toronto) */
  startTime: string;
  endTime: string;
};

export const BROSSARD_TRAINING_SLOTS: readonly BrossardSlot[] = [
  { season: "summer", title: "Group training", dayOfWeek: 1, startTime: "20:00", endTime: "22:00" },
  { season: "summer", title: "Group training", dayOfWeek: 2, startTime: "20:00", endTime: "22:00" },
  { season: "summer", title: "Group training", dayOfWeek: 3, startTime: "20:00", endTime: "22:00" },
  { season: "summer", title: "Group training", dayOfWeek: 6, startTime: "13:30", endTime: "15:30" },
  { season: "summer", title: "Group training", dayOfWeek: 0, startTime: "13:00", endTime: "15:00" },
  { season: "winter", title: "Group training", dayOfWeek: 0, startTime: "15:15", endTime: "17:15" },
];

/** Series start: never before `fromDate` so past practices are not created. */
export function slotStartDate(slot: BrossardSlot, fromDate: string): string {
  const season = BROSSARD_SEASONS[slot.season];
  return fromDate > season.startDate ? fromDate : season.startDate;
}

/** All dated occurrences for a slot, from `fromDate` (YYYY-MM-DD) onward. */
export function occurrencesForSlot(
  slot: BrossardSlot,
  fromDate: string,
): Occurrence[] {
  const season = BROSSARD_SEASONS[slot.season];
  const startDate = slotStartDate(slot, fromDate);
  if (startDate > season.endDate) return [];

  return generateWeeklyOccurrences({
    dayOfWeek: slot.dayOfWeek,
    startTime: slot.startTime,
    endTime: slot.endTime,
    startDate,
    endDate: season.endDate,
  });
}
