export const APP_ROLES = [
  "super_admin",
  "admin",
  "coach",
  "parent",
  "player",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

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
  "jeanyao5787@gmail.com": ["coach"],
  "jeanemm@hotmail.ca": ["super_admin", "coach"],
};

export function isStaffRole(role: AppRole) {
  return role === "super_admin" || role === "admin" || role === "coach";
}

export function canManageTeam(roles: AppRole[]) {
  return roles.includes("super_admin");
}

export function formatRole(role: AppRole) {
  return role.replace("_", " ");
}
