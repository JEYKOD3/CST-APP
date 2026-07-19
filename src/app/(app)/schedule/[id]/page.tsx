import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import {
  canManageSchedule,
  isParentAccount,
  isStaffAccount,
} from "@/lib/roles";
import {
  getEventDetail,
  listAvailableFleet,
  listCoaches,
  listVenues,
} from "@/features/calendar/queries";
import {
  ManageEventPanel,
  type ManageEventData,
} from "@/features/calendar/components/manage-event-panel";
import {
  dayKey,
  formatDayHeading,
  formatLevel,
  formatTimeRange,
  zonedTimeInput,
} from "@/lib/calendar";

export default async function ScheduleEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await ensureAppUser();
  const { id } = await params;
  const event = await getEventDetail(id);
  if (!event) notFound();

  const canManage = canManageSchedule(user.roles);
  const staff = isStaffAccount(user.roles);

  const [venues, coaches, fleet] = await Promise.all([
    canManage ? listVenues() : Promise.resolve([]),
    canManage ? listCoaches() : Promise.resolve([]),
    staff && event.requiresCar ? listAvailableFleet() : Promise.resolve([]),
  ]);

  const manageData: ManageEventData = {
    id: event.id,
    venueId: event.venueId,
    dateInput: dayKey(event.startsAt),
    startInput: zonedTimeInput(event.startsAt),
    endInput: zonedTimeInput(event.endsAt),
    notes: event.notes ?? "",
    canceled: event.canceled,
    coaches: event.coaches,
  };

  return (
    <main>
      <Link href="/schedule" className="text-xs text-zinc-500">
        ← Schedule
      </Link>

      <div className="mt-2 flex items-start justify-between gap-2">
        <h1 className="text-xl font-bold">{event.title}</h1>
        <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
          {formatLevel(event.level)}
        </span>
      </div>

      {event.canceled && (
        <p className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          This practice has been canceled.
        </p>
      )}

      <div className="mt-4 space-y-1 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
        <p className="text-[#8BC34A]">{formatDayHeading(event.startsAt)}</p>
        <p className="text-zinc-200">
          {formatTimeRange(event.startsAt, event.endsAt)}
        </p>
        <p className="text-zinc-400">
          {event.venueName}
          {event.region && event.region !== event.venueName
            ? ` · ${event.region}`
            : ""}
        </p>
        {event.notes && <p className="pt-1 text-zinc-500">{event.notes}</p>}
      </div>

      {staff && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
          <p className="mb-1 font-medium text-zinc-200">
            {event.coaches.length > 0
              ? `Coaches: ${event.coaches.map((c) => c.name).join(", ")}`
              : "No coach assigned"}
          </p>
          {event.requiresCar && (
            <p className="text-xs text-zinc-400">
              {fleet.length > 0
                ? `Available cars: ${fleet
                    .map((f) => `${f.name} (${f.currentLocation})`)
                    .join(", ")}`
                : "No charged car currently available"}
            </p>
          )}
        </div>
      )}

      {isParentAccount(user.roles) && !event.canceled && (
        <Link
          href="/attendance"
          className="mt-4 block rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm"
        >
          <span className="font-medium text-[#8BC34A]">Confirm attendance →</span>
          <span className="mt-1 block text-xs text-zinc-400">
            Let the coach know which of your kids are coming.
          </span>
        </Link>
      )}

      {canManage && (
        <ManageEventPanel
          event={manageData}
          venues={venues}
          allCoaches={coaches.map((c) => ({
            userId: c.userId,
            name: c.name ?? c.email,
          }))}
        />
      )}
    </main>
  );
}
