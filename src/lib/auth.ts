import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { appUsers, userRoles } from "@/db/schema";
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

async function bootstrapRoles(userId: string, email: string) {
  const db = getDb();
  const normalized = email.toLowerCase();
  const bootstrap = STAFF_BOOTSTRAP[normalized];

  const existing = await db
    .select()
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  if (existing.length > 0) return;

  const rolesToAdd: AppRole[] = bootstrap ?? ["parent"];

  await db.insert(userRoles).values(
    rolesToAdd.map((role) => ({ userId, role })),
  );
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
      .returning();
    await bootstrapRoles(user.id, email);
  } else if (displayName && user.displayName !== displayName) {
    [user] = await db
      .update(appUsers)
      .set({ displayName })
      .where(eq(appUsers.id, user.id))
      .returning();
  }

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
