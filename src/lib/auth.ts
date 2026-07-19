import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { appUsers, userRoles } from "@/db/schema";
import {
  fulfillPendingRoles,
  getPendingRolesForEmail,
} from "@/features/admin/invites/queries";
import { normalizeUserRoles } from "@/lib/role-sync";
import {
  type AppRole,
  STAFF_BOOTSTRAP,
} from "@/lib/roles";

export type SessionUser = {
  id: string;
  clerkUserId: string;
  email: string;
  displayName: string | null;
  roles: AppRole[];
};

async function ensureUserRoles(userId: string, email: string) {
  const db = getDb();
  const normalized = email.toLowerCase();
  const existing = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  const pendingRoles = await getPendingRolesForEmail(normalized);
  const have = new Set(existing.map((r) => r.role as AppRole));

  if (existing.length === 0) {
    const rolesToAdd: AppRole[] =
      pendingRoles.length > 0
        ? pendingRoles
        : (STAFF_BOOTSTRAP[normalized] ?? ["parent"]);
    await db.insert(userRoles).values(
      rolesToAdd.map((role) => ({ userId, role })),
    );
    if (pendingRoles.length > 0) {
      await fulfillPendingRoles(normalized);
    }
  } else {
    const bootstrap = STAFF_BOOTSTRAP[normalized];
    const toAdd: AppRole[] = [];

    if (bootstrap) {
      toAdd.push(...bootstrap.filter((role) => !have.has(role)));
    }
    for (const role of pendingRoles) {
      if (!have.has(role)) toAdd.push(role);
    }

    if (toAdd.length > 0) {
      await db.insert(userRoles).values(
        toAdd.map((role) => ({ userId, role })),
      );
    }
    if (pendingRoles.length > 0) {
      await fulfillPendingRoles(normalized);
    }
  }

  await normalizeUserRoles(userId);
}

export async function ensureAppUser(): Promise<SessionUser> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress;

  if (!email) redirect("/sign-in");

  const db = getDb();
  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    null;

  let [user] = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.clerkUserId, clerkUserId))
    .limit(1);

  if (!user) {
    [user] = await db
      .insert(appUsers)
      .values({ clerkUserId, email, displayName })
      .onConflictDoUpdate({
        target: appUsers.clerkUserId,
        set: { email, displayName },
      })
      .returning();
  } else if (displayName && user.displayName !== displayName) {
    [user] = await db
      .update(appUsers)
      .set({ displayName })
      .where(eq(appUsers.id, user.id))
      .returning();
  }

  await ensureUserRoles(user.id, email);

  const roles = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, user.id));

  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    displayName: user.displayName,
    roles: roles.map((r) => r.role as AppRole),
  };
}

export function hasRole(user: SessionUser, role: AppRole) {
  return user.roles.includes(role);
}

export function hasAnyRole(user: SessionUser, roles: AppRole[]) {
  return roles.some((role) => user.roles.includes(role));
}
