import type { AppRole } from "@/lib/roles";

export function getPendingRolesForEmail(
  rows: { role: AppRole }[],
): AppRole[] {
  return rows.map((r) => r.role);
}

export function resolveInitialRoles(
  pending: AppRole[],
  bootstrap: AppRole[] | undefined,
  hasExistingRoles: boolean,
): AppRole[] {
  if (hasExistingRoles) return [];
  if (pending.length > 0) return pending;
  return bootstrap ?? ["parent"];
}
