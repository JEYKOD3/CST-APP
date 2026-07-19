"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { getDb } from "@/db";
import { players, registrations } from "@/db/schema";
import { ensureAppUser } from "@/lib/auth";
import {
  ALLOWED_PROOF_TYPES,
  CURRENT_REGISTRATION_SEASON,
  MAX_PROOF_FILE_BYTES,
  canReviewRegistrations,
} from "@/lib/registration";
import { isParentAccount } from "@/lib/roles";
import { getOpenRegistrationForPlayer } from "./queries";

async function uploadProof(
  file: File,
  registrationId: string,
): Promise<{ url: string; fileName: string } | { error: string }> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      error:
        "Photo upload is not configured yet — submit with e-transfer reference only, or ask CST to enable proof upload.",
    } as const;
  }

  if (!ALLOWED_PROOF_TYPES.includes(file.type as (typeof ALLOWED_PROOF_TYPES)[number])) {
    return { error: "Proof must be a JPG, PNG, WebP, or PDF." } as const;
  }

  if (file.size > MAX_PROOF_FILE_BYTES) {
    return { error: "Proof file must be 4 MB or smaller." } as const;
  }

  const blob = await put(
    `registrations/${registrationId}/${file.name}`,
    file,
    { access: "public", addRandomSuffix: true },
  );

  if (!blob.url) {
    return { error: "Upload failed — try again or submit reference only." };
  }

  return { url: blob.url, fileName: file.name };
}

export async function submitRegistration(formData: FormData) {
  const user = await ensureAppUser();
  if (!isParentAccount(user.roles)) {
    return { error: "Only parent accounts can register children." };
  }

  const playerId = String(formData.get("playerId") ?? "");
  const eTransferReference = String(formData.get("eTransferReference") ?? "")
    .trim();
  const parentNotes = String(formData.get("parentNotes") ?? "").trim();
  const proof = formData.get("proof");

  if (!playerId || !eTransferReference) {
    return { error: "Select a child and enter your e-transfer reference." };
  }

  const db = getDb();
  const [player] = await db
    .select()
    .from(players)
    .where(
      and(
        eq(players.id, playerId),
        eq(players.parentUserId, user.id),
        eq(players.active, true),
      ),
    )
    .limit(1);

  if (!player) {
    return { error: "That child was not found on your account." };
  }

  const existing = await getOpenRegistrationForPlayer(playerId);
  if (existing) {
    return {
      error:
        existing.status === "approved"
          ? "This child is already registered for Summer 2026."
          : "A registration is already pending review for this child.",
    };
  }

  const [registration] = await db
    .insert(registrations)
    .values({
      playerId,
      parentUserId: user.id,
      season: CURRENT_REGISTRATION_SEASON,
      eTransferReference,
      parentNotes: parentNotes || null,
    })
    .returning();

  let proofUrl: string | null = null;
  let proofFileName: string | null = null;

  if (proof instanceof File && proof.size > 0) {
    const uploaded = await uploadProof(proof, registration.id);
    if ("url" in uploaded) {
      proofUrl = uploaded.url;
      proofFileName = uploaded.fileName;
    }
  }

  if (proofUrl) {
    await db
      .update(registrations)
      .set({ proofUrl, proofFileName, updatedAt: new Date() })
      .where(eq(registrations.id, registration.id));
  }

  revalidatePath("/register");
  revalidatePath("/admin");

  const proofFailed =
    proof instanceof File && proof.size > 0 && !proofUrl;

  return {
    ok: true,
    message: proofFailed
      ? "Registration submitted with e-transfer reference. Proof photo could not be uploaded — CST will follow up if needed."
      : proofUrl
        ? "Registration submitted with payment proof. CST will review it soon."
        : "Registration submitted. CST will review your e-transfer reference.",
  };
}

export async function approveRegistration(registrationId: string) {
  const actor = await ensureAppUser();
  if (!canReviewRegistrations(actor.roles)) return;

  const db = getDb();
  await db
    .update(registrations)
    .set({
      status: "approved",
      reviewedByUserId: actor.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(registrations.id, registrationId),
        eq(registrations.status, "pending_review"),
      ),
    );

  revalidatePath("/admin");
  revalidatePath("/register");
}

export async function rejectRegistration(registrationId: string) {
  const actor = await ensureAppUser();
  if (!canReviewRegistrations(actor.roles)) return;

  const db = getDb();
  await db
    .update(registrations)
    .set({
      status: "rejected",
      reviewedByUserId: actor.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(registrations.id, registrationId),
        eq(registrations.status, "pending_review"),
      ),
    );

  revalidatePath("/admin");
  revalidatePath("/register");
}
