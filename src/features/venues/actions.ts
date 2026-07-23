"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { practiceVenues } from "@/db/schema";
import { ensureAppUser } from "@/lib/auth";
import { canManageSchedule } from "@/lib/roles";

type ActionResult = { ok?: boolean; error?: string; message?: string };

function revalidateVenueViews() {
  revalidatePath("/schedule/venues");
  revalidatePath("/schedule/manage");
  revalidatePath("/schedule");
}

export async function createVenue(formData: FormData): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can manage venues." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const requiresCar = formData.get("requiresCar") === "on";

  if (!name || !address || !region) {
    return { error: "Name, address and region are required." };
  }

  const db = getDb();
  await db.insert(practiceVenues).values({ name, address, region, requiresCar });

  revalidateVenueViews();
  return { ok: true, message: `Venue "${name}" added.` };
}

export async function updateVenue(formData: FormData): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can manage venues." };
  }

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const requiresCar = formData.get("requiresCar") === "on";

  if (!id || !name || !address || !region) {
    return { error: "Name, address and region are required." };
  }

  const db = getDb();
  await db
    .update(practiceVenues)
    .set({ name, address, region, requiresCar })
    .where(eq(practiceVenues.id, id));

  revalidateVenueViews();
  return { ok: true, message: "Venue updated." };
}

export async function setVenueActive(
  venueId: string,
  active: boolean,
): Promise<ActionResult> {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) {
    return { error: "Only admins can manage venues." };
  }
  if (!venueId) return { error: "Missing venue." };

  const db = getDb();
  await db
    .update(practiceVenues)
    .set({ active })
    .where(eq(practiceVenues.id, venueId));

  revalidateVenueViews();
  return { ok: true, message: active ? "Venue reactivated." : "Venue deactivated." };
}
