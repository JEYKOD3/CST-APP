import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userRoles } from "@/db/schema";
import { normalizeUserRoles } from "@/lib/role-sync";
import type { AppRole } from "@/lib/roles";

export async function assignRolesToUser(userId: string, roles: AppRole[]) {
  const db = getDb();
  for (const role of roles) {
    const [existing] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role)))
      .limit(1);
    if (!existing) {
      await db.insert(userRoles).values({ userId, role });
    }
  }
  await normalizeUserRoles(userId);
}
