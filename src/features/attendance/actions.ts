"use server";

import { and, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { attendanceRecords, players, scheduleEvents } from "@/db/schema";
import { ensureAppUser } from "@/lib/auth";
import {
  coachResultToStatus,
  type CoachResult,
  isFinalized,
  parentIntentToStatus,
  type ParentIntent,
} from "@/lib/attendance";
import { isParentAccount, isStaffAccount } from "@/lib/roles";

type ActionResult = { ok?: boolean; error?: string; message?: string };

/** Parent confirms or declines a child's attendance for an upcoming practice. */
export async function setChildAttendance(
  formData: FormData,
): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!isParentAccount(user.roles)) {
    return { error: "Only parent accounts can confirm attendance." };
  }

  const eventId = String(formData.get("eventId") ?? "");
  const playerId = String(formData.get("playerId") ?? "");
  const intent = String(formData.get("intent") ?? "") as ParentIntent;

  if (!eventId || !playerId || (intent !== "confirm" && intent !== "decline")) {
    return { error: "Missing attendance details." };
  }

  const db = getDb();

  // Ownership: the player must belong to this parent and be active.
  const [child] = await db
    .select({ id: players.id })
    .from(players)
    .where(
      and(
        eq(players.id, playerId),
        eq(players.parentUserId, user.id),
        eq(players.active, true),
      ),
    )
    .limit(1);

  if (!child) {
    return { error: "That child is not on your account." };
  }

  // Can only respond to upcoming practices.
  const [event] = await db
    .select({ id: scheduleEvents.id })
    .from(scheduleEvents)
    .where(
      and(eq(scheduleEvents.id, eventId), gte(scheduleEvents.endsAt, new Date())),
    )
    .limit(1);

  if (!event) {
    return { error: "That practice is no longer open for confirmation." };
  }

  // Don't let a parent overwrite a result the coach already locked in.
  const [existing] = await db
    .select({ status: attendanceRecords.status })
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.eventId, eventId),
        eq(attendanceRecords.playerId, playerId),
      ),
    )
    .limit(1);

  if (existing && isFinalized(existing.status)) {
    return { error: "The coach already recorded attendance for this practice." };
  }

  const status = parentIntentToStatus(intent);
  const now = new Date();

  await db
    .insert(attendanceRecords)
    .values({ eventId, playerId, status, parentConfirmedAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [attendanceRecords.eventId, attendanceRecords.playerId],
      set: { status, parentConfirmedAt: now, updatedAt: now },
    });

  revalidatePath("/attendance");
  return { ok: true };
}

/** Coach records the final present/absent result at the practice. */
export async function finalizeAttendance(
  formData: FormData,
): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!isStaffAccount(user.roles)) {
    return { error: "Only staff can finalize attendance." };
  }

  const eventId = String(formData.get("eventId") ?? "");
  const playerId = String(formData.get("playerId") ?? "");
  const result = String(formData.get("result") ?? "") as CoachResult;

  if (!eventId || !playerId || (result !== "present" && result !== "absent")) {
    return { error: "Missing attendance details." };
  }

  const db = getDb();

  const [event] = await db
    .select({ id: scheduleEvents.id })
    .from(scheduleEvents)
    .where(eq(scheduleEvents.id, eventId))
    .limit(1);

  if (!event) return { error: "Practice not found." };

  const status = coachResultToStatus(result);
  const now = new Date();

  await db
    .insert(attendanceRecords)
    .values({
      eventId,
      playerId,
      status,
      coachFinalizedAt: now,
      coachFinalizedByUserId: user.id,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [attendanceRecords.eventId, attendanceRecords.playerId],
      set: {
        status,
        coachFinalizedAt: now,
        coachFinalizedByUserId: user.id,
        updatedAt: now,
      },
    });

  revalidatePath(`/attendance/${eventId}`);
  revalidatePath("/attendance");
  return { ok: true };
}
