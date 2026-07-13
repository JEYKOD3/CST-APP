import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appUsers, staffInvites } from "@/db/schema";
import type { AppRole } from "@/lib/roles";

export async function listPendingInvites() {
  const db = getDb();
  const rows = await db
    .select({
      id: staffInvites.id,
      email: staffInvites.email,
      role: staffInvites.role,
      createdAt: staffInvites.createdAt,
      invitedByName: appUsers.displayName,
      invitedByEmail: appUsers.email,
    })
    .from(staffInvites)
    .leftJoin(appUsers, eq(appUsers.id, staffInvites.invitedByUserId))
    .orderBy(staffInvites.createdAt);

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role as AppRole,
    createdAt: row.createdAt,
    invitedBy: row.invitedByName ?? row.invitedByEmail ?? "Unknown",
  }));
}
