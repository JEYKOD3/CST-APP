import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { players } from "@/db/schema";

export async function listChildrenForParent(parentUserId: string) {
  const db = getDb();
  return db
    .select()
    .from(players)
    .where(
      and(eq(players.parentUserId, parentUserId), eq(players.active, true)),
    );
}
