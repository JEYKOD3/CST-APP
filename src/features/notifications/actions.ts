"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { ensureAppUser } from "@/lib/auth";

export async function markAllNotificationsRead() {
  const user = await ensureAppUser();
  const db = getDb();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, user.id), isNull(notifications.readAt)),
    );
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}

export async function markNotificationRead(notificationId: string) {
  const user = await ensureAppUser();
  const db = getDb();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, user.id),
      ),
    );
  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}
