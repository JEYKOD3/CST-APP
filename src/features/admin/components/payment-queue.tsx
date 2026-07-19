import Link from "next/link";
import {
  approveRegistration,
  rejectRegistration,
} from "@/features/registration/actions";
import type { PendingRegistrationRow } from "@/features/registration/queries";
import { CURRENT_REGISTRATION_LABEL } from "@/lib/registration";

export function PaymentQueue({
  pending,
}: {
  pending: PendingRegistrationRow[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">
          Payment queue ({pending.length})
        </h2>
        <span className="text-xs text-zinc-500">{CURRENT_REGISTRATION_LABEL}</span>
      </div>

      {pending.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
          No registrations waiting for review.
        </p>
      ) : (
        <ul className="space-y-3">
          {pending.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
            >
              <p className="font-medium">
                {row.playerFirstName} {row.playerLastName}
              </p>
              <p className="text-xs capitalize text-zinc-500">
                {row.playerLevel} · {row.parentName ?? row.parentEmail}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                E-transfer ref:{" "}
                <span className="font-mono text-zinc-200">
                  {row.eTransferReference}
                </span>
              </p>
              {row.parentNotes && (
                <p className="mt-1 text-xs text-zinc-500">{row.parentNotes}</p>
              )}
              {row.proofUrl ? (
                <Link
                  href={`/api/registrations/${row.id}/proof`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-[#8BC34A] underline"
                >
                  View proof{row.proofFileName ? `: ${row.proofFileName}` : ""}
                </Link>
              ) : (
                <p className="mt-2 text-xs text-zinc-500">No proof file attached</p>
              )}

              <div className="mt-3 flex gap-2">
                <form action={approveRegistration.bind(null, row.id)}>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#8BC34A] px-3 py-1.5 text-xs font-semibold text-black"
                  >
                    Approve
                  </button>
                </form>
                <form action={rejectRegistration.bind(null, row.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
