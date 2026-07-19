import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { pendingRoleAssignments } from "@/db/schema";
import type { AppRole } from "@/lib/roles";

export async function listPendingInvites() {
  const db = getDb();
  return db
    .select()
    .from(pendingRoleAssignments)
    .where(isNull(pendingRoleAssignments.fulfilledAt))
    .orderBy(pendingRoleAssignments.createdAt);
}

export async function getPendingRolesForEmail(email: string) {
  const db = getDb();
  const rows = await db
    .select({ role: pendingRoleAssignments.role })
    .from(pendingRoleAssignments)
    .where(
      and(
        eq(pendingRoleAssignments.email, email.toLowerCase()),
        isNull(pendingRoleAssignments.fulfilledAt),
      ),
    );
  return rows.map((r) => r.role as AppRole);
}

export async function fulfillPendingRoles(email: string) {
  const db = getDb();
  await db
    .update(pendingRoleAssignments)
    .set({ fulfilledAt: new Date() })
    .where(
      and(
        eq(pendingRoleAssignments.email, email.toLowerCase()),
        isNull(pendingRoleAssignments.fulfilledAt),
      ),
    );
}
