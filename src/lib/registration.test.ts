import { describe, expect, it } from "vitest";
import {
  CURRENT_REGISTRATION_SEASON,
  canReviewRegistrations,
  formatRegistrationStatus,
  isOpenRegistrationStatus,
} from "./registration";

describe("registration", () => {
  it("defines current season", () => {
    expect(CURRENT_REGISTRATION_SEASON).toBe("summer-2026");
  });

  it("allows super admin and admin to review", () => {
    expect(canReviewRegistrations(["super_admin"])).toBe(true);
    expect(canReviewRegistrations(["admin"])).toBe(true);
    expect(canReviewRegistrations(["coach"])).toBe(false);
  });

  it("formats status labels", () => {
    expect(formatRegistrationStatus("pending_review")).toBe("pending review");
    expect(formatRegistrationStatus("approved")).toBe("approved");
  });

  it("blocks duplicate open registrations", () => {
    expect(isOpenRegistrationStatus("pending_review")).toBe(true);
    expect(isOpenRegistrationStatus("approved")).toBe(true);
    expect(isOpenRegistrationStatus("rejected")).toBe(false);
  });
});
