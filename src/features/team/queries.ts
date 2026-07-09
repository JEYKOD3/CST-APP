import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appUsers, userRoles } from "@/db/schema";
import type { AppRole } from "@/lib/roles";

export async function listTeamMembers() {
  const db = getDb();
  const rows = await db
    .select({
      userId: appUsers.id,
      email: appUsers.email,
      displayName: appUsers.displayName,
      role: userRoles.role,
    })
    .from(userRoles)
    .innerJoin(appUsers, eq(appUsers.id, userRoles.userId))
    .orderBy(appUsers.email);

  return rows.reduce<
    Record<
      string,
      { email: string; name: string | null; roles: AppRole[]; userId: string }
    >
  >((acc, row) => {
    if (!acc[row.userId]) {
      acc[row.userId] = {
        userId: row.userId,
        email: row.email,
        name: row.displayName,
        roles: [],
      };
    }
    acc[row.userId].roles.push(row.role as AppRole);
    return acc;
  }, {});
}
