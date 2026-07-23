import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import { canManageSchedule } from "@/lib/roles";
import {
  getSeasonVenueMap,
  getSeriesEventStats,
  listSeasons,
  listSeriesForSeason,
  listVenues,
} from "@/features/calendar/queries";
import { ScheduleManager } from "@/features/calendar/components/schedule-manager";
import { SeasonEditor } from "@/features/calendar/components/season-editor";
import { SeasonVenuesEditor } from "@/features/calendar/components/season-venues-editor";
import {
  SeasonSlots,
  type Slot,
} from "@/features/calendar/components/season-slots";
import { formatDayHeading } from "@/lib/calendar";

export default async function ScheduleManagePage() {
  const user = await ensureAppUser();
  if (!canManageSchedule(user.roles)) redirect("/schedule");

  const [venues, seasons, seasonVenueIds] = await Promise.all([
    listVenues(),
    listSeasons(),
    getSeasonVenueMap(),
  ]);
  const seriesBySeason = await Promise.all(
    seasons.map((s) => listSeriesForSeason(s.id)),
  );
  const allSeriesIds = seriesBySeason.flat().map((s) => s.id);
  const stats = await getSeriesEventStats(allSeriesIds);

  const slotsBySeason: Slot[][] = seriesBySeason.map((series) =>
    series.map((s) => {
      const st = stats.get(s.id);
      return {
        id: s.id,
        venueId: s.venueId,
        venueName: s.venueName,
        title: s.title,
        level: s.level,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        active: s.active,
        upcoming: st?.upcoming ?? 0,
        nextLabel: st?.nextStartsAt ? formatDayHeading(st.nextStartsAt) : null,
      };
    }),
  );

  return (
    <main>
      <Link href="/schedule" className="text-xs text-zinc-500">
        ← Schedule
      </Link>
      <h1 className="mb-1 mt-2 text-xl font-bold">Manage schedule</h1>
      <p className="mb-4 text-sm text-zinc-400">
        Seasons → venues → weekly practice slots. Edit or remove a slot to update
        upcoming practices (past ones stay). Everyone is notified on changes.
      </p>

      <Link
        href="/schedule/venues"
        className="mb-6 inline-block rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200"
      >
        Manage venues →
      </Link>

      <ScheduleManager
        venues={venues}
        seasons={seasons.map((s) => ({ id: s.id, name: s.name }))}
        seasonVenueIds={seasonVenueIds}
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
                <p className="font-medium text-[#8BC34A]">
                  {season.name}
                  {!season.active && (
                    <span className="ml-2 text-xs font-normal text-amber-500">
                      (archived)
                    </span>
                  )}
                </p>
                <p className="mb-2 text-xs text-zinc-500">
                  {season.startDate.toISOString().slice(0, 10)} →{" "}
                  {season.endDate.toISOString().slice(0, 10)}
                </p>
                <SeasonEditor
                  season={{
                    id: season.id,
                    name: season.name,
                    startDate: season.startDate.toISOString().slice(0, 10),
                    endDate: season.endDate.toISOString().slice(0, 10),
                    active: season.active,
                  }}
                />
                {season.active && (
                  <SeasonVenuesEditor
                    seasonId={season.id}
                    venues={venues}
                    selectedIds={seasonVenueIds[season.id] ?? []}
                  />
                )}
                <div className="mt-4">
                  <SeasonSlots
                    slots={slotsBySeason[i]}
                    venues={venues.filter((v) =>
                      (seasonVenueIds[season.id] ?? []).includes(v.id),
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
