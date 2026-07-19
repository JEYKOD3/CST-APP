import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";

export async function listNotifications(userId: string, limit = 30) {
  const db = getDb();
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function countUnread(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .limit(1);
  return Number(row?.total ?? 0);
}
