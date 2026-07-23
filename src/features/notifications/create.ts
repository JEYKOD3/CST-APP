import { getDb } from "@/db";
import { appUsers, notifications } from "@/db/schema";

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

/**
 * Fan out a notification to EVERY account in the system (parents, players,
 * coaches, admins) — used for club-wide schedule changes. Fetches all user ids
 * then batch-inserts through {@link notifyUsers}.
 */
export async function notifyAllUsers(
  input: Omit<NewNotification, "userIds">,
): Promise<void> {
  const db = getDb();
  const rows = await db.select({ id: appUsers.id }).from(appUsers);
  await notifyUsers({ ...input, userIds: rows.map((r) => r.id) });
}
