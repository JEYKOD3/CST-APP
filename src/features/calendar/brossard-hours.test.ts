import { describe, expect, it } from "vitest";
import {
  BROSSARD_SEASONS,
  BROSSARD_TRAINING_SLOTS,
  occurrencesForSlot,
  slotStartDate,
} from "./brossard-hours";

// Fixed reference date for deterministic tests (a Wednesday).
const FROM = "2026-07-22";

function slot(season: "summer" | "winter", dayOfWeek: number) {
  const found = BROSSARD_TRAINING_SLOTS.find(
    (s) => s.season === season && s.dayOfWeek === dayOfWeek,
  );
  if (!found) throw new Error(`No ${season} slot for weekday ${dayOfWeek}`);
  return found;
}

describe("Brossard training hours", () => {
  it("defines the club-provided weekly slots", () => {
    expect(slot("summer", 1).startTime).toBe("20:00"); // Mon 8 PM
    expect(slot("summer", 2).endTime).toBe("22:00"); // Tue → 10 PM
    expect(slot("summer", 3).startTime).toBe("20:00"); // Wed 8 PM
    expect(slot("summer", 6).startTime).toBe("13:30"); // Sat 1:30 PM
    expect(slot("summer", 0).startTime).toBe("13:00"); // Sun 1 PM
    expect(slot("winter", 0).startTime).toBe("15:15"); // Sun 3:15 PM
    expect(slot("winter", 0).endTime).toBe("17:15");
    expect(BROSSARD_TRAINING_SLOTS).toHaveLength(6);
  });

  it("summer runs to end of September, winter from September to end of February", () => {
    expect(BROSSARD_SEASONS.summer.endDate).toBe("2026-09-30");
    expect(BROSSARD_SEASONS.winter.startDate).toBe("2026-09-01");
    expect(BROSSARD_SEASONS.winter.endDate).toBe("2027-02-28");
  });

  it("never schedules before the from-date", () => {
    // Summer started Jun 1 but seeding on Jul 22 must not create July 1–21 events.
    expect(slotStartDate(slot("summer", 1), FROM)).toBe(FROM);
    // Winter starts later than the from-date → keep the season start.
    expect(slotStartDate(slot("winter", 0), FROM)).toBe("2026-09-01");
  });

  it("generates the expected number of practices from Jul 22 2026", () => {
    expect(occurrencesForSlot(slot("summer", 1), FROM)).toHaveLength(10); // Mondays
    expect(occurrencesForSlot(slot("summer", 2), FROM)).toHaveLength(10); // Tuesdays
    expect(occurrencesForSlot(slot("summer", 3), FROM)).toHaveLength(11); // Wednesdays incl. Jul 22
    expect(occurrencesForSlot(slot("summer", 6), FROM)).toHaveLength(10); // Saturdays
    expect(occurrencesForSlot(slot("summer", 0), FROM)).toHaveLength(10); // Sundays
    expect(occurrencesForSlot(slot("winter", 0), FROM)).toHaveLength(26); // Winter Sundays
  });

  it("returns no occurrences when the season is already over", () => {
    expect(occurrencesForSlot(slot("summer", 1), "2026-10-01")).toHaveLength(0);
  });

  it("uses Montreal wall-clock time (Mon 8 PM EDT = midnight UTC)", () => {
    const [first] = occurrencesForSlot(slot("summer", 1), FROM);
    // Mon Jul 27, 20:00 EDT === Jul 28 00:00 UTC
    expect(first.startsAt.toISOString()).toBe("2026-07-28T00:00:00.000Z");
    expect(first.endsAt.toISOString()).toBe("2026-07-28T02:00:00.000Z");
  });

  it("keeps 3:15 PM wall-clock across the DST change (Nov 1 2026)", () => {
    const winter = occurrencesForSlot(slot("winter", 0), FROM);
    const oct25 = winter.find((o) => o.startsAt.toISOString().startsWith("2026-10-25"));
    const nov1 = winter.find((o) => o.startsAt.toISOString().startsWith("2026-11-01"));
    // 15:15 EDT (UTC-4) → 19:15 UTC; 15:15 EST (UTC-5) → 20:15 UTC.
    expect(oct25?.startsAt.toISOString()).toBe("2026-10-25T19:15:00.000Z");
    expect(nov1?.startsAt.toISOString()).toBe("2026-11-01T20:15:00.000Z");
  });
});
