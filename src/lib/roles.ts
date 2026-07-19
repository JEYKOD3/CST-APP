export const APP_ROLES = [
  "super_admin",
  "admin",
  "coach",
  "parent",
  "player",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const STAFF_ROLES = ["super_admin", "admin", "coach"] as const;

export type RoleGroup = "staff" | "parent" | "player";

export const PLAYER_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "elite",
] as const;

export type PlayerLevel = (typeof PLAYER_LEVELS)[number];

/** Initial staff — modifiable later in Team settings. */
export const STAFF_BOOTSTRAP: Record<string, AppRole[]> = {
  "ghaidaghaniyu.cstbrossard@gmail.com": ["super_admin", "coach"],
  "m.h.vakili@gmail.com": ["super_admin", "coach"],
  "jeanemm@hotmail.ca": ["super_admin", "coach"],
};

export function isStaffRole(role: AppRole) {
  return (STAFF_ROLES as readonly string[]).includes(role);
}

/** One account type at a time: staff, parent, or teen player. Staff roles can combine. */
export function resolveRoleGroup(roles: AppRole[]): RoleGroup | null {
  if (roles.some(isStaffRole)) return "staff";
  if (roles.includes("player")) return "player";
  if (roles.includes("parent")) return "parent";
  return null;
}

export function rolesIncompatibleWithGroup(group: RoleGroup): AppRole[] {
  switch (group) {
    case "staff":
      return ["parent", "player"];
    case "player":
      return [...STAFF_ROLES, "parent"];
    case "parent":
      return [...STAFF_ROLES, "player"];
  }
}

/** Returns roles to keep after applying exclusivity rules. */
export function getNormalizedRoles(roles: AppRole[]): AppRole[] {
  const group = resolveRoleGroup(roles);
  if (!group) return [];
  const incompatible = new Set(rolesIncompatibleWithGroup(group));
  return roles.filter((role) => !incompatible.has(role));
}

export function isStaffAccount(roles: AppRole[]) {
  return resolveRoleGroup(roles) === "staff";
}

export function isParentAccount(roles: AppRole[]) {
  return resolveRoleGroup(roles) === "parent";
}

export function isPlayerAccount(roles: AppRole[]) {
  return resolveRoleGroup(roles) === "player";
}

export function canManageTeam(roles: AppRole[]) {
  return roles.includes("super_admin");
}

/** Admin hub: team roles + staff invites (super_admin only). */
export function canAccessAdminHub(roles: AppRole[]) {
  return canManageTeam(roles);
}

/** Roles assignable via staff invite (not parent/player). */
export const STAFF_INVITE_ROLES = APP_ROLES.filter(
  (r) => r !== "parent" && r !== "player",
) as Exclude<AppRole, "parent" | "player">[];

export function formatRole(role: AppRole) {
  return role.replace("_", " ");
}

export function formatRoleGroup(roles: AppRole[]) {
  const group = resolveRoleGroup(roles);
  if (group === "staff") {
    return roles.filter(isStaffRole).map(formatRole).join(" · ");
  }
  if (group === "player") return "player (teen)";
  if (group === "parent") return "parent";
  return "";
}
