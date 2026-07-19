import Link from "next/link";

export type CoachPracticeRow = {
  eventId: string;
  title: string;
  type: string;
  when: string;
  venueName: string;
  region: string;
  confirmed: number;
  declined: number;
  finalized: number;
};

export function CoachPracticeList({ practices }: { practices: CoachPracticeRow[] }) {
  if (practices.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
        No upcoming practices scheduled.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {practices.map((p) => (
        <Link
          key={p.eventId}
          href={`/attendance/${p.eventId}`}
          className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <h2 className="font-semibold text-[#8BC34A]">{p.title}</h2>
          <p className="text-xs text-zinc-500">
            {p.when} · {p.venueName} ({p.region})
          </p>
          <div className="mt-2 flex gap-3 text-xs text-zinc-400">
            <span className="text-[#8BC34A]">{p.confirmed} going</span>
            <span className="text-red-400">{p.declined} can&apos;t</span>
            <span>{p.finalized} finalized</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
