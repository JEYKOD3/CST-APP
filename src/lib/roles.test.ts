import { describe, expect, it } from "vitest";
import {
  APP_ROLES,
  PLAYER_LEVELS,
  STAFF_BOOTSTRAP,
  STAFF_INVITE_ROLES,
  canAccessAdminHub,
  canManageTeam,
  formatRole,
  formatRoleGroup,
  getNormalizedRoles,
  isParentAccount,
  isPlayerAccount,
  isStaffAccount,
  isStaffRole,
  resolveRoleGroup,
} from "./roles";

describe("roles", () => {
  it("defines expected app roles", () => {
    expect(APP_ROLES).toContain("super_admin");
    expect(APP_ROLES).toContain("parent");
    expect(APP_ROLES).toContain("player");
  });

  it("defines player levels", () => {
    expect(PLAYER_LEVELS).toEqual(["beginner", "intermediate", "elite"]);
  });

  it("bootstraps staff emails", () => {
    expect(STAFF_BOOTSTRAP["jeanemm@hotmail.ca"]).toEqual([
      "super_admin",
      "coach",
    ]);
    expect(STAFF_BOOTSTRAP["ghaidaghaniyu.cstbrossard@gmail.com"]).toEqual([
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
  });

  it("only super_admin can access admin hub", () => {
    expect(canAccessAdminHub(["super_admin"])).toBe(true);
    expect(canAccessAdminHub(["admin"])).toBe(false);
  });

  it("limits staff invite roles to staff only", () => {
    expect(STAFF_INVITE_ROLES).toEqual(["super_admin", "admin", "coach"]);
    expect(STAFF_INVITE_ROLES).not.toContain("parent");
    expect(STAFF_INVITE_ROLES).not.toContain("player");
  });

  it("formats role labels", () => {
    expect(formatRole("super_admin")).toBe("super admin");
  });

  it("staff cannot combine with parent", () => {
    expect(getNormalizedRoles(["coach", "parent"])).toEqual(["coach"]);
    expect(getNormalizedRoles(["super_admin", "coach", "parent"])).toEqual([
      "super_admin",
      "coach",
    ]);
    expect(resolveRoleGroup(["coach", "parent"])).toBe("staff");
    expect(isStaffAccount(["coach", "parent"])).toBe(true);
    expect(isParentAccount(["coach", "parent"])).toBe(false);
  });

  it("staff cannot combine with teen player", () => {
    expect(getNormalizedRoles(["admin", "player"])).toEqual(["admin"]);
    expect(isPlayerAccount(["coach", "player"])).toBe(false);
  });

  it("parent cannot combine with staff or player", () => {
    expect(getNormalizedRoles(["parent", "player"])).toEqual(["player"]);
    expect(resolveRoleGroup(["parent", "player"])).toBe("player");
    expect(isParentAccount(["parent"])).toBe(true);
    expect(isPlayerAccount(["player"])).toBe(true);
  });

  it("staff roles can stack", () => {
    expect(getNormalizedRoles(["super_admin", "coach"])).toEqual([
      "super_admin",
      "coach",
    ]);
    expect(formatRoleGroup(["super_admin", "coach"])).toBe(
      "super admin · coach",
    );
  });
});
