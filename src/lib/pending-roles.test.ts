import { describe, expect, it } from "vitest";
import {
  getPendingRolesForEmail,
  resolveInitialRoles,
} from "./pending-roles";

describe("pending-roles", () => {
  it("extracts roles from pending rows", () => {
    expect(
      getPendingRolesForEmail([{ role: "coach" }, { role: "admin" }]),
    ).toEqual(["coach", "admin"]);
  });

  it("prefers pending roles over default parent", () => {
    expect(resolveInitialRoles(["coach"], undefined, false)).toEqual(["coach"]);
  });

  it("falls back to bootstrap when no pending", () => {
    expect(
      resolveInitialRoles([], ["super_admin", "coach"], false),
    ).toEqual(["super_admin", "coach"]);
  });

  it("defaults to parent for new accounts", () => {
    expect(resolveInitialRoles([], undefined, false)).toEqual(["parent"]);
  });

  it("returns empty when user already has roles", () => {
    expect(resolveInitialRoles(["coach"], undefined, true)).toEqual([]);
  });
});
