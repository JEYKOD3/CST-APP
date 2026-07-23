import { redirect } from "next/navigation";
import { PaymentQueue } from "@/features/admin/components/payment-queue";
import { listPendingRegistrations } from "@/features/registration/queries";
import { ensureAppUser } from "@/lib/auth";
import { canReviewRegistrations } from "@/lib/registration";

export default async function PaymentsPage() {
  const user = await ensureAppUser();
  if (!canReviewRegistrations(user.roles)) redirect("/dashboard");

  const pending = await listPendingRegistrations();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="cst-page-title mb-1">Payments</h1>
        <p className="text-sm text-zinc-400">
          Review summer registrations and e-transfer proof — approve or reject
          manually.
        </p>
      </div>
      <PaymentQueue pending={pending} />
    </main>
  );
}
