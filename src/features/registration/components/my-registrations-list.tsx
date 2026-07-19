import { formatRegistrationStatus } from "@/lib/registration";
import type { RegistrationRow } from "@/features/registration/queries";

export function MyRegistrationsList({
  registrations,
}: {
  registrations: RegistrationRow[];
}) {
  if (registrations.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="mb-3 font-semibold">Your registrations</h2>
      <ul className="space-y-2">
        {registrations.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
          >
            <p className="font-medium">
              {row.playerFirstName} {row.playerLastName}
            </p>
            <p className="text-xs capitalize text-zinc-500">
              {row.season.replace("-", " ")} · {row.playerLevel}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Status:{" "}
              <span className="capitalize text-zinc-300">
                {formatRegistrationStatus(row.status)}
              </span>
            </p>
            <p className="text-xs text-zinc-500">
              Ref: {row.eTransferReference}
            </p>
            {row.adminNotes && (
              <p className="mt-1 text-xs text-amber-400/90">{row.adminNotes}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
