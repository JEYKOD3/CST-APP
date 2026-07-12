"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { appUsers, userRoles } from "@/db/schema";
import { ensureAppUser } from "@/lib/auth";
import {
  APP_ROLES,
  type AppRole,
  canManageTeam,
} from "@/lib/roles";

export async function assignRole(formData: FormData) {
  const actor = await ensureAppUser();
  if (!canManageTeam(actor.roles)) {
    return { error: "Only super admins can manage team roles." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "") as AppRole;

  if (!email || !APP_ROLES.includes(role)) {
    return { error: "Email and role are required." };
  }

  const db = getDb();
  const [target] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1);

  if (!target) {
    return {
      error:
        "No account with that email yet. They must sign in once, then you can assign a role.",
    };
  }

  const [existing] = await db
    .select()
    .from(userRoles)
    .where(and(eq(userRoles.userId, target.id), eq(userRoles.role, role)))
    .limit(1);

  if (existing) {
    return { error: "They already have this role." };
  }

  await db.insert(userRoles).values({ userId: target.id, role });

  revalidatePath("/team");
  return { ok: true };
}

export async function removeRole(userId: string, role: AppRole) {
  const actor = await ensureAppUser();
  if (!canManageTeam(actor.roles)) return;

  const db = getDb();
  await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role)));

  revalidatePath("/team");
}
