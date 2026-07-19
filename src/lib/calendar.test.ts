import { describe, expect, it } from "vitest";
import {
  formatLevel,
  generateWeeklyOccurrences,
  MAX_OCCURRENCES,
  weekdayOf,
  zonedTimeToUtc,
} from "./calendar";

describe("calendar occurrences", () => {
  it("computes weekday of a date independent of tz", () => {
    // 2026-07-20 is a Monday.
    expect(weekdayOf("2026-07-20")).toBe(1);
    // 2026-07-19 is a Sunday.
    expect(weekdayOf("2026-07-19")).toBe(0);
  });

  it("generates one occurrence per matching weekday in range", () => {
    // Mondays between Jul 20 and Aug 17, 2026 → 20, 27, Aug 3, 10, 17 = 5.
    const occ = generateWeeklyOccurrences({
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "15:00",
      startDate: "2026-07-20",
      endDate: "2026-08-17",
    });
    expect(occ).toHaveLength(5);
    expect(occ[0].startsAt.getTime()).toBeLessThan(occ[0].endsAt.getTime());
  });

  it("returns empty when no weekday matches the range", () => {
    const occ = generateWeeklyOccurrences({
      dayOfWeek: 6, // Saturday
      startTime: "09:00",
      endTime: "10:00",
      startDate: "2026-07-20", // Mon
      endDate: "2026-07-24", // Fri
    });
    expect(occ).toHaveLength(0);
  });

  it("never exceeds the safety ceiling", () => {
    const occ = generateWeeklyOccurrences({
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      startDate: "2000-01-03",
      endDate: "2100-01-01",
    });
    expect(occ.length).toBeLessThanOrEqual(MAX_OCCURRENCES);
  });

  it("maps a summer 9am wall-clock time to the correct UTC instant (EDT = UTC-4)", () => {
    const d = zonedTimeToUtc("2026-07-20", "09:00");
    // 09:00 EDT === 13:00 UTC
    expect(d.toISOString()).toBe("2026-07-20T13:00:00.000Z");
  });

  it("maps a winter 9am wall-clock time across DST (EST = UTC-5)", () => {
    const d = zonedTimeToUtc("2026-01-19", "09:00");
    // 09:00 EST === 14:00 UTC
    expect(d.toISOString()).toBe("2026-01-19T14:00:00.000Z");
  });

  it("labels a null level as All levels", () => {
    expect(formatLevel(null)).toBe("All levels");
    expect(formatLevel("beginner")).toBe("Beginner");
    expect(formatLevel("elite")).toBe("Elite");
  });
});
