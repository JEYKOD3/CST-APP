import { getDb } from "@/db";
import { notifications } from "@/db/schema";

type NotificationType =
  | "practice_created"
  | "practice_updated"
  | "practice_canceled"
  | "coach_assigned"
  | "general";

export type NewNotification = {
  userIds: string[];
  type: NotificationType;
  title: string;
  body?: string | null;
  relatedEventId?: string | null;
};

/**
 * Fan out one notification to many recipients in a single insert.
 * De-dupes user ids so a parent/coach never gets the same row twice.
 */
export async function notifyUsers(input: NewNotification): Promise<void> {
  const ids = Array.from(new Set(input.userIds)).filter(Boolean);
  if (ids.length === 0) return;

  const db = getDb();
  await db.insert(notifications).values(
    ids.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      relatedEventId: input.relatedEventId ?? null,
    })),
  );
}
