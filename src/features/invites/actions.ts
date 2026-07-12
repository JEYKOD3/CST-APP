"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { appUsers, staffInvites, userRoles } from "@/db/schema";
import { ensureAppUser } from "@/lib/auth";
import {
  STAFF_INVITE_ROLES,
  type AppRole,
  canAccessAdminHub,
} from "@/lib/roles";

export async function createStaffInvite(formData: FormData) {
  const actor = await ensureAppUser();
  if (!canAccessAdminHub(actor.roles)) {
    return { error: "Only super admins can send staff invites." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "") as AppRole;

  if (!email || !STAFF_INVITE_ROLES.includes(role as (typeof STAFF_INVITE_ROLES)[number])) {
    return { error: "Email and a staff role are required." };
  }

  const db = getDb();

  const [target] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1);

  if (target) {
    const [existingRole] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, target.id), eq(userRoles.role, role)))
      .limit(1);

    if (existingRole) {
      return { error: "That person already has this role." };
    }
  }

  const [existingInvite] = await db
    .select()
    .from(staffInvites)
    .where(and(eq(staffInvites.email, email), eq(staffInvites.role, role)))
    .limit(1);

  if (existingInvite) {
    return { error: "An invite for that email and role already exists." };
  }

  await db.insert(staffInvites).values({
    email,
    role,
    invitedByUserId: actor.id,
  });

  revalidatePath("/admin/invites");
  revalidatePath("/admin");
  return { ok: true };
}

export async function revokeStaffInvite(inviteId: string) {
  const actor = await ensureAppUser();
  if (!canAccessAdminHub(actor.roles)) return;

  const db = getDb();
  await db.delete(staffInvites).where(eq(staffInvites.id, inviteId));

  revalidatePath("/admin/invites");
  revalidatePath("/admin");
}
