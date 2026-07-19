import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { userRoles } from "@/db/schema";
import { getNormalizedRoles, type AppRole } from "@/lib/roles";

/** Enforce one role group per account (staff | parent | player). */
export async function normalizeUserRoles(userId: string) {
  const db = getDb();
  const rows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  const current = rows.map((r) => r.role as AppRole);
  let target = getNormalizedRoles(current);

  if (target.length === 0) {
    target = ["parent"];
  }

  const toRemove = current.filter((role) => !target.includes(role));
  const toAdd = target.filter((role) => !current.includes(role));

  if (toRemove.length > 0) {
    await db
      .delete(userRoles)
      .where(
        and(
          eq(userRoles.userId, userId),
          inArray(userRoles.role, toRemove),
        ),
      );
  }

  if (toAdd.length > 0) {
    await db.insert(userRoles).values(
      toAdd.map((role) => ({ userId, role })),
    );
  }
}
