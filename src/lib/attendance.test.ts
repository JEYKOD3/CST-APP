import { describe, expect, it } from "vitest";
import {
  ATTENDANCE_STATUSES,
  coachResultToStatus,
  formatAttendanceStatus,
  isExpected,
  isFinalized,
  isParentResponse,
  parentIntentToStatus,
} from "./attendance";

describe("attendance status", () => {
  it("lists the five lifecycle statuses", () => {
    expect(ATTENDANCE_STATUSES).toEqual([
      "pending",
      "parent_confirmed",
      "parent_absent",
      "present",
      "absent",
    ]);
  });

  it("maps parent intent to a status", () => {
    expect(parentIntentToStatus("confirm")).toBe("parent_confirmed");
    expect(parentIntentToStatus("decline")).toBe("parent_absent");
  });

  it("maps coach result to a status", () => {
    expect(coachResultToStatus("present")).toBe("present");
    expect(coachResultToStatus("absent")).toBe("absent");
  });

  it("detects a parent response", () => {
    expect(isParentResponse("parent_confirmed")).toBe(true);
    expect(isParentResponse("parent_absent")).toBe(true);
    expect(isParentResponse("pending")).toBe(false);
    expect(isParentResponse("present")).toBe(false);
  });

  it("detects a coach-finalized status (parents can't override)", () => {
    expect(isFinalized("present")).toBe(true);
    expect(isFinalized("absent")).toBe(true);
    expect(isFinalized("parent_confirmed")).toBe(false);
    expect(isFinalized("pending")).toBe(false);
  });

  it("counts confirmed and present players as expected", () => {
    expect(isExpected("parent_confirmed")).toBe(true);
    expect(isExpected("present")).toBe(true);
    expect(isExpected("parent_absent")).toBe(false);
    expect(isExpected("absent")).toBe(false);
    expect(isExpected("pending")).toBe(false);
  });

  it("formats every status without falling through", () => {
    for (const status of ATTENDANCE_STATUSES) {
      expect(formatAttendanceStatus(status)).toBeTruthy();
    }
  });
});
