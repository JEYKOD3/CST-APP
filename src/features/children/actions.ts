"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { players } from "@/db/schema";
import { ensureAppUser } from "@/lib/auth";
import { isParentAccount } from "@/lib/roles";
import { PLAYER_LEVELS, type PlayerLevel } from "@/lib/roles";

export async function addChild(formData: FormData) {
  const user = await ensureAppUser();
  if (!isParentAccount(user.roles)) {
    return { error: "Only parent accounts can manage children." };
  }
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const level = String(formData.get("level") ?? "") as PlayerLevel;
  const isTeen = formData.get("isTeen") === "on";

  if (!firstName || !lastName) {
    return { error: "First and last name are required." };
  }
  if (!PLAYER_LEVELS.includes(level)) {
    return { error: "Please select a level." };
  }

  const db = getDb();
  await db.insert(players).values({
    parentUserId: user.id,
    firstName,
    lastName,
    level,
    isTeenSelfManaged: isTeen,
  });

  revalidatePath("/children");
  return { ok: true };
}

export async function removeChild(playerId: string) {
  const user = await ensureAppUser();
  if (!isParentAccount(user.roles)) return;
  const db = getDb();

  await db
    .update(players)
    .set({ active: false })
    .where(
      and(eq(players.id, playerId), eq(players.parentUserId, user.id)),
    );

  revalidatePath("/children");
}
