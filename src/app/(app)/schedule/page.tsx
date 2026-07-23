import Link from "next/link";
import { ensureAppUser } from "@/lib/auth";
import { canManageSchedule, isStaffAccount, PLAYER_LEVELS } from "@/lib/roles";
import { getAgenda, listVenues } from "@/features/calendar/queries";
import { Agenda } from "@/features/calendar/components/agenda";
import { dayKey, zonedTimeToUtc } from "@/lib/calendar";
import type { PlayerLevel } from "@/lib/roles";

const DEFAULT_DAYS = 21;

type SearchParams = { level?: string; venue?: string; days?: string };

function buildHref(base: SearchParams, patch: Partial<SearchParams>): string {
  const merged = { ...base, ...patch };
  const params = new URLSearchParams();
  if (merged.level) params.set("level", merged.level);
  if (merged.venue) params.set("venue", merged.venue);
  if (merged.days) params.set("days", merged.days);
  const qs = params.toString();
  return qs ? `/schedule?${qs}` : "/schedule";
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await ensureAppUser();
  const sp = await searchParams;

  const level = (PLAYER_LEVELS as readonly string[]).includes(sp.level ?? "")
    ? (sp.level as PlayerLevel)
    : undefined;
  const days = Math.min(Math.max(Number(sp.days) || DEFAULT_DAYS, 7), 180);

  const from = zonedTimeToUtc(dayKey(new Date()), "00:00");
  const to = new Date(from.getTime() + days * 86_400_000);

  const [venues, events] = await Promise.all([
    listVenues(),
    getAgenda({ from, to, level, venueId: sp.venue }),
  ]);

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-medium ${
      active ? "bg-[#8BC34A] text-black" : "border border-zinc-700 text-zinc-300"
    }`;

  const canManage = canManageSchedule(user.roles);

  return (
    <main>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="cst-page-title">Schedule</h1>
          <p className="cst-muted mt-1">Practices by day</p>
        </div>
        {canManage && (
          <Link
            href="/schedule/manage"
            className="shrink-0 rounded-lg bg-[#8BC34A] px-3 py-1.5 text-xs font-semibold text-black"
          >
            Manage
          </Link>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Link href={buildHref(sp, { level: undefined })} className={chip(!level)}>
          All levels
        </Link>
        {PLAYER_LEVELS.map((lvl) => (
          <Link
            key={lvl}
            href={buildHref(sp, { level: lvl })}
            className={chip(level === lvl)}
          >
            {lvl[0].toUpperCase() + lvl.slice(1)}
          </Link>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        <Link href={buildHref(sp, { venue: undefined })} className={chip(!sp.venue)}>
          All venues
        </Link>
        {venues.map((v) => (
          <Link
            key={v.id}
            href={buildHref(sp, { venue: v.id })}
            className={chip(sp.venue === v.id)}
          >
            {v.name}
          </Link>
        ))}
      </div>

      <Agenda events={events} showCoaches={isStaffAccount(user.roles)} />

      <div className="mt-6 text-center">
        <Link
          href={buildHref(sp, { days: String(days + 21) })}
          className="inline-block rounded-lg border border-zinc-700 px-4 py-2 text-xs text-zinc-300"
        >
          Load more dates
        </Link>
      </div>
    </main>
  );
}
