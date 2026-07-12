import { and, eq } from "drizzle-orm";
import type { getDb } from "@/db";
import * as schema from "@/db/schema";
import type { AppRole } from "@/lib/roles";

type Db = ReturnType<typeof getDb>;

export async function applyPendingInvites(
  db: Db,
  userId: string,
  email: string,
): Promise<AppRole[]> {
  const normalized = email.trim().toLowerCase();
  const invites = await db
    .select()
    .from(schema.staffInvites)
    .where(eq(schema.staffInvites.email, normalized));

  const applied: AppRole[] = [];

  for (const invite of invites) {
    const role = invite.role as AppRole;
    const [existing] = await db
      .select()
      .from(schema.userRoles)
      .where(
        and(
          eq(schema.userRoles.userId, userId),
          eq(schema.userRoles.role, role),
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(schema.userRoles).values({ userId, role });
      applied.push(role);
    }

    await db
      .delete(schema.staffInvites)
      .where(eq(schema.staffInvites.id, invite.id));
  }

  return applied;
}
