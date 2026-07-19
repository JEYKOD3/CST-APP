import type { AppRole } from "@/lib/roles";

export const CURRENT_REGISTRATION_SEASON = "summer-2026";
export const CURRENT_REGISTRATION_LABEL = "Summer 2026";

export const REGISTRATION_STATUSES = [
  "pending_review",
  "approved",
  "rejected",
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const MAX_PROOF_FILE_BYTES = 4 * 1024 * 1024;
export const ALLOWED_PROOF_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export function canReviewRegistrations(roles: AppRole[]) {
  return roles.includes("super_admin") || roles.includes("admin");
}

export function formatRegistrationStatus(status: RegistrationStatus) {
  switch (status) {
    case "pending_review":
      return "pending review";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
  }
}

export function isOpenRegistrationStatus(status: RegistrationStatus) {
  return status === "pending_review" || status === "approved";
}
