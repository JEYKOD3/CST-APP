import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { appUsers, players, registrations } from "@/db/schema";
import {
  CURRENT_REGISTRATION_SEASON,
  type RegistrationStatus,
} from "@/lib/registration";

export async function listRegistrationsForParent(parentUserId: string) {
  const db = getDb();
  return db
    .select({
      id: registrations.id,
      season: registrations.season,
      status: registrations.status,
      eTransferReference: registrations.eTransferReference,
      proofUrl: registrations.proofUrl,
      parentNotes: registrations.parentNotes,
      adminNotes: registrations.adminNotes,
      createdAt: registrations.createdAt,
      playerFirstName: players.firstName,
      playerLastName: players.lastName,
      playerLevel: players.level,
    })
    .from(registrations)
    .innerJoin(players, eq(players.id, registrations.playerId))
    .where(eq(registrations.parentUserId, parentUserId))
    .orderBy(desc(registrations.createdAt));
}

export async function getOpenRegistrationForPlayer(
  playerId: string,
  season: string = CURRENT_REGISTRATION_SEASON,
) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(registrations)
    .where(
      and(
        eq(registrations.playerId, playerId),
        eq(registrations.season, season),
        inArray(registrations.status, ["pending_review", "approved"]),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listPendingRegistrations() {
  const db = getDb();
  return db
    .select({
      id: registrations.id,
      season: registrations.season,
      status: registrations.status,
      eTransferReference: registrations.eTransferReference,
      proofUrl: registrations.proofUrl,
      proofFileName: registrations.proofFileName,
      parentNotes: registrations.parentNotes,
      createdAt: registrations.createdAt,
      playerFirstName: players.firstName,
      playerLastName: players.lastName,
      playerLevel: players.level,
      parentEmail: appUsers.email,
      parentName: appUsers.displayName,
    })
    .from(registrations)
    .innerJoin(players, eq(players.id, registrations.playerId))
    .innerJoin(appUsers, eq(appUsers.id, registrations.parentUserId))
    .where(eq(registrations.status, "pending_review"))
    .orderBy(registrations.createdAt);
}

export async function countPendingRegistrations() {
  const rows = await listPendingRegistrations();
  return rows.length;
}

export type RegistrationRow = Awaited<
  ReturnType<typeof listRegistrationsForParent>
>[number];

export type PendingRegistrationRow = Awaited<
  ReturnType<typeof listPendingRegistrations>
>[number];

export function registrationStatusLabel(status: RegistrationStatus) {
  return status.replace("_", " ");
}
