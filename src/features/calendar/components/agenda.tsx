import Link from "next/link";
import {
  dayKey,
  formatDayHeading,
  formatLevel,
  formatTimeRange,
} from "@/lib/calendar";
import type { AgendaEvent } from "@/features/calendar/queries";

const LEVEL_BADGE: Record<string, string> = {
  beginner: "bg-emerald-500/15 text-emerald-300",
  intermediate: "bg-sky-500/15 text-sky-300",
  elite: "bg-violet-500/15 text-violet-300",
};

function LevelBadge({ level }: { level: string | null }) {
  const cls = level ? LEVEL_BADGE[level] : "bg-zinc-700/40 text-zinc-300";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {formatLevel(level as never)}
    </span>
  );
}

export function Agenda({
  events,
  showCoaches = false,
}: {
  events: AgendaEvent[];
  showCoaches?: boolean;
}) {
  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
        No practices in this range. Try loading more, or adjust the filters.
      </p>
    );
  }

  const groups: { key: string; date: Date; items: AgendaEvent[] }[] = [];
  for (const event of events) {
    const key = dayKey(event.startsAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(event);
    else groups.push({ key, date: event.startsAt, items: [event] });
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {formatDayHeading(group.date)}
          </h2>
          <div className="space-y-2">
            {group.items.map((event) => (
              <Link
                key={event.id}
                href={`/schedule/${event.id}`}
                className={`block rounded-xl border p-3 transition ${
                  event.canceled
                    ? "border-zinc-800 bg-zinc-900/50 opacity-60"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-zinc-100">
                      {event.title}
                      {event.canceled && (
                        <span className="ml-2 text-xs font-normal text-red-400">
                          Canceled
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-[#8BC34A]">
                      {formatTimeRange(event.startsAt, event.endsAt)}
                    </p>
                  </div>
                  <LevelBadge level={event.level} />
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  {event.venueName}
                  {event.region && event.region !== event.venueName
                    ? ` · ${event.region}`
                    : ""}
                </p>
                {showCoaches && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {event.coaches.length > 0
                      ? `Coach: ${event.coaches.map((c) => c.name).join(", ")}`
                      : "No coach assigned"}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
