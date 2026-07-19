import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getRegistrationById } from "@/features/registration/queries";
import { ensureAppUser } from "@/lib/auth";
import { canReviewRegistrations } from "@/lib/registration";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await ensureAppUser();
  if (!canReviewRegistrations(user.roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const registration = await getRegistrationById(id);
  if (!registration?.proofUrl) {
    return NextResponse.json({ error: "No proof on file" }, { status: 404 });
  }

  const result = await get(registration.proofUrl, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: "Proof unavailable" }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${
        registration.proofFileName ?? "proof"
      }"`,
      "Cache-Control": "private, no-store",
    },
  });
}
