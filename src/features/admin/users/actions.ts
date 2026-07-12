"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { appUsers, players, userRoles } from "@/db/schema";
import { ensureAppUser } from "@/lib/auth";
import { normalizeUserRoles } from "@/lib/role-sync";
import {
  APP_ROLES,
  type AppRole,
  canManageTeam,
  isParentAccount,
  PLAYER_LEVELS,
  type PlayerLevel,
} from "@/lib/roles";
import { assignRolesToUser } from "./role-utils";
import { countSuperAdmins } from "./queries";

export async function assignRole(formData: FormData) {
  const actor = await ensureAppUser();
  if (!canManageTeam(actor.roles)) {
    return { error: "Only super admins can manage roles." };
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
        "No account yet — use Invite above to pre-assign their role and send email.",
    };
  }

  await assignRolesToUser(target.id, [role]);
  revalidatePath("/admin");
  return { ok: true };
}

export async function removeRole(userId: string, role: AppRole) {
  const actor = await ensureAppUser();
  if (!canManageTeam(actor.roles)) return;

  if (role === "super_admin") {
    const superAdminCount = await countSuperAdmins();
    if (superAdminCount <= 1) {
      return;
    }
  }

  const db = getDb();
  await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, userId), eq(userRoles.role, role)));

  await normalizeUserRoles(userId);
  revalidatePath("/admin");
}

export async function updateUserDisplayName(formData: FormData) {
  const actor = await ensureAppUser();
  if (!canManageTeam(actor.roles)) {
    return { error: "Only super admins can edit accounts." };
  }

  const userId = String(formData.get("userId") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!userId || !displayName) {
    return { error: "User and display name are required." };
  }

  const db = getDb();
  await db
    .update(appUsers)
    .set({ displayName })
    .where(eq(appUsers.id, userId));

  revalidatePath("/admin");
  return { ok: true };
}

export async function adminAddPlayer(formData: FormData) {
  const actor = await ensureAppUser();
  if (!canManageTeam(actor.roles)) {
    return { error: "Only super admins can add players." };
  }

  const parentEmail = String(formData.get("parentEmail") ?? "")
    .trim()
    .toLowerCase();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const level = String(formData.get("level") ?? "") as PlayerLevel;
  const isTeen = formData.get("isTeen") === "on";

  if (!parentEmail || !firstName || !lastName) {
    return { error: "Parent email, first name, and last name are required." };
  }
  if (!PLAYER_LEVELS.includes(level)) {
    return { error: "Please select a level." };
  }

  const db = getDb();
  const [parent] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, parentEmail))
    .limit(1);

  if (!parent) {
    return {
      error:
        "Parent has not signed in yet — invite them first, then add their child.",
    };
  }

  const parentRoles = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, parent.id));

  if (!isParentAccount(parentRoles.map((r) => r.role as AppRole))) {
    return {
      error:
        "That account is staff or a teen player — parents need a parent-only account for children.",
    };
  }

  await db.insert(players).values({
    parentUserId: parent.id,
    firstName,
    lastName,
    level,
    isTeenSelfManaged: isTeen,
  });

  revalidatePath("/admin");
  return { ok: true };
}
