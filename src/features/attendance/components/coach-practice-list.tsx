import Link from "next/link";

export type CoachPracticeRow = {
  eventId: string;
  title: string;
  when: string;
  venueName: string;
  confirmed: number;
  declined: number;
  marked: number;
  needsAction: boolean;
};

export function CoachPracticeList({ practices }: { practices: CoachPracticeRow[] }) {
  if (practices.length === 0) {
    return (
      <p className="cst-muted rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)] px-4 py-8 text-center">
        No upcoming practices.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {practices.map((p) => (
        <li key={p.eventId}>
          <Link
            href={`/attendance/${p.eventId}`}
            className="flex items-center gap-3 rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)] p-4 active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-zinc-50">{p.title}</p>
              <p className="cst-muted mt-0.5 truncate">
                {p.when} · {p.venueName}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[length:var(--cst-text-xs)]">
                <span className="rounded-full bg-[var(--cst-green-dim)] px-2 py-0.5 text-[var(--cst-green)]">
                  {p.confirmed} coming
                </span>
                {p.declined > 0 && (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-red-300">
                    {p.declined} out
                  </span>
                )}
                {p.needsAction ? (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-300">
                    Tap to mark present
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-400">
                    {p.marked} marked
                  </span>
                )}
              </div>
            </div>
            <span className="text-[var(--cst-green)]" aria-hidden>
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
