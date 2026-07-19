import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import { canManageSchedule } from "@/lib/roles";
import {
  listSeasons,
  listSeriesForSeason,
  listVenues,
} from "@/features/calendar/queries";
import { ScheduleManager } from "@/features/calendar/components/schedule-manager";
import { formatLevel, WEEKDAYS_SHORT } from "@/lib/calendar";

export default async function ScheduleManagePage() {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) redirect("/schedule");

  const [venues, seasons] = await Promise.all([listVenues(), listSeasons()]);
  const seriesBySeason = await Promise.all(
    seasons.map((s) => listSeriesForSeason(s.id)),
  );

  return (
    <main>
      <Link href="/schedule" className="text-xs text-zinc-500">
        ← Schedule
      </Link>
      <h1 className="mb-1 mt-2 text-xl font-bold">Manage schedule</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Create a season, generate recurring practices per venue and level, or add
        a one-off. Each venue can have its own weekly schedule.
      </p>

      <ScheduleManager
        venues={venues}
        seasons={seasons.map((s) => ({ id: s.id, name: s.name }))}
      />

      {seasons.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Existing seasons
          </h2>
          <div className="space-y-4">
            {seasons.map((season, i) => (
              <div
                key={season.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <p className="font-medium text-[#8BC34A]">{season.name}</p>
                <p className="mb-2 text-xs text-zinc-500">
                  {season.startDate.toISOString().slice(0, 10)} →{" "}
                  {season.endDate.toISOString().slice(0, 10)}
                </p>
                {seriesBySeason[i].length === 0 ? (
                  <p className="text-xs text-zinc-500">No recurring practices yet.</p>
                ) : (
                  <ul className="space-y-1 text-xs text-zinc-300">
                    {seriesBySeason[i].map((s) => (
                      <li key={s.id} className="flex justify-between gap-2">
                        <span>
                          {WEEKDAYS_SHORT[s.dayOfWeek]} {s.startTime}–{s.endTime} ·{" "}
                          {s.title}
                        </span>
                        <span className="text-zinc-500">
                          {s.region} · {formatLevel(s.level as never)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
