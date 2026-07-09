import { listUpcomingScheduleEvents } from "@/features/schedule/queries";
import { formatScheduleWhen } from "@/features/schedule/utils";

export default async function SchedulePage() {
  const events = await listUpcomingScheduleEvents();

  return (
    <main>
      <h1 className="mb-1 text-xl font-bold">Schedule</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Single source of truth for all locations.
      </p>

      {events.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
          No upcoming sessions yet. Admins will publish the master calendar here.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => {
            const when = formatScheduleWhen(event.startsAt, event.endsAt);
            return (
              <li
                key={event.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h2 className="font-semibold">{event.title}</h2>
                  <span className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-xs capitalize text-zinc-400">
                    {event.type}
                  </span>
                </div>
                <p className="text-sm text-[#8BC34A]">{when.day}</p>
                <p className="text-sm text-zinc-300">{when.time}</p>
                <p className="mt-2 text-sm text-zinc-400">
                  {event.venueName} · {event.region}
                </p>
                <p className="text-xs text-zinc-600">{event.venueAddress}</p>
                {event.notes && (
                  <p className="mt-2 text-sm text-zinc-500">{event.notes}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
