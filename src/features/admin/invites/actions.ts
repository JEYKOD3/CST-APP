"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { appUsers, pendingRoleAssignments } from "@/db/schema";
import { ensureAppUser } from "@/lib/auth";
import {
  APP_ROLES,
  type AppRole,
  canManageTeam,
} from "@/lib/roles";
import { assignRolesToUser } from "@/features/admin/users/role-utils";

import { fulfillPendingRoles } from "./queries";

function appBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export async function inviteUser(formData: FormData) {
  const actor = await ensureAppUser();
  if (!canManageTeam(actor.roles)) {
    return { error: "Only super admins can invite users." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "") as AppRole;
  const sendEmail = formData.get("sendEmail") === "on";

  if (!email || !APP_ROLES.includes(role)) {
    return { error: "Email and role are required." };
  }

  const db = getDb();

  const [existingPending] = await db
    .select()
    .from(pendingRoleAssignments)
    .where(
      and(
        eq(pendingRoleAssignments.email, email),
        eq(pendingRoleAssignments.role, role),
        isNull(pendingRoleAssignments.fulfilledAt),
      ),
    )
    .limit(1);

  if (!existingPending) {
    await db.insert(pendingRoleAssignments).values({
      email,
      role,
      invitedByUserId: actor.id,
    });
  }

  const [existingUser] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.email, email))
    .limit(1);

  if (existingUser) {
    await assignRolesToUser(existingUser.id, [role]);
    await fulfillPendingRoles(email);
    revalidatePath("/admin");
    return {
      ok: true,
      message: "Account already exists — role applied immediately.",
    };
  }

  if (sendEmail) {
    try {
      const clerk = await clerkClient();
      const invitation = await clerk.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: `${appBaseUrl()}/sign-up`,
        notify: true,
        publicMetadata: { cstInvitedRole: role },
      });

      await db
        .update(pendingRoleAssignments)
        .set({ clerkInvitationId: invitation.id })
        .where(
          and(
            eq(pendingRoleAssignments.email, email),
            eq(pendingRoleAssignments.role, role),
            isNull(pendingRoleAssignments.fulfilledAt),
          ),
        );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Clerk invitation failed.";
      if (!message.includes("already") && !message.includes("exists")) {
        return {
          error: `Invite saved but email failed: ${message}. They can still sign up and get the role.`,
        };
      }
    }
  }

  revalidatePath("/admin");
  return {
    ok: true,
    message: sendEmail
      ? "Invitation email sent. Role applies when they sign up."
      : "Email saved. Assign role when they create an account, or resend with email.",
  };
}

export async function cancelPendingInvite(inviteId: string) {
  const actor = await ensureAppUser();
  if (!canManageTeam(actor.roles)) return;

  const db = getDb();
  await db
    .delete(pendingRoleAssignments)
    .where(
      and(
        eq(pendingRoleAssignments.id, inviteId),
        isNull(pendingRoleAssignments.fulfilledAt),
      ),
    );

  revalidatePath("/admin");
}
