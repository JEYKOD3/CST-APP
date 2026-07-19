export const ATTENDANCE_STATUSES = [
  "pending",
  "parent_confirmed",
  "parent_absent",
  "present",
  "absent",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/** What the parent can choose ahead of a practice. */
export type ParentIntent = "confirm" | "decline";

/** What the coach records at the practice. */
export type CoachResult = "present" | "absent";

export function parentIntentToStatus(intent: ParentIntent): AttendanceStatus {
  return intent === "confirm" ? "parent_confirmed" : "parent_absent";
}

export function coachResultToStatus(result: CoachResult): AttendanceStatus {
  return result === "present" ? "present" : "absent";
}

/** Parent responded (either way) — used to gate coach overrides & counts. */
export function isParentResponse(status: AttendanceStatus): boolean {
  return status === "parent_confirmed" || status === "parent_absent";
}

/** Coach has locked the final present/absent result. */
export function isFinalized(status: AttendanceStatus): boolean {
  return status === "present" || status === "absent";
}

/** True when the record counts as "expected at practice" for roster totals. */
export function isExpected(status: AttendanceStatus): boolean {
  return status === "parent_confirmed" || status === "present";
}

export function formatAttendanceStatus(status: AttendanceStatus): string {
  switch (status) {
    case "pending":
      return "No response";
    case "parent_confirmed":
      return "Confirmed";
    case "parent_absent":
      return "Can't attend";
    case "present":
      return "Present";
    case "absent":
      return "Absent";
  }
}
