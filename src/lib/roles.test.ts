import { describe, expect, it } from "vitest";
import {
  APP_ROLES,
  PLAYER_LEVELS,
  STAFF_BOOTSTRAP,
  canManageTeam,
  formatRole,
  isStaffRole,
} from "./roles";

describe("roles", () => {
  it("defines expected app roles", () => {
    expect(APP_ROLES).toContain("super_admin");
    expect(APP_ROLES).toContain("parent");
  });

  it("defines player levels", () => {
    expect(PLAYER_LEVELS).toEqual([
      "beginner",
      "intermediate",
      "advanced",
      "elite",
    ]);
  });

  it("bootstraps Ghaida and Mohammad as super_admin + coach", () => {
    expect(STAFF_BOOTSTRAP["ghaidaghaniyu.cstbrossard@gmail.com"]).toEqual([
      "super_admin",
      "coach",
    ]);
    expect(STAFF_BOOTSTRAP["m.h.vakili@gmail.com"]).toEqual([
      "super_admin",
      "coach",
    ]);
  });

  it("identifies staff roles", () => {
    expect(isStaffRole("coach")).toBe(true);
    expect(isStaffRole("parent")).toBe(false);
  });

  it("only super_admin can manage team", () => {
    expect(canManageTeam(["super_admin"])).toBe(true);
    expect(canManageTeam(["admin"])).toBe(false);
    expect(canManageTeam(["coach", "admin"])).toBe(false);
  });

  it("formats role labels", () => {
    expect(formatRole("super_admin")).toBe("super admin");
  });
});
