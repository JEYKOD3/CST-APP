"use client";

import { useTransition } from "react";
import { setChildAttendance } from "@/features/attendance/actions";
import { type AttendanceStatus, isFinalized } from "@/lib/attendance";

export type ParentChildRow = {
  playerId: string;
  name: string;
  status: AttendanceStatus;
};

export type ParentEventRow = {
  eventId: string;
  title: string;
  type: string;
  when: string;
  venueName: string;
  region: string;
  children: ParentChildRow[];
};

const baseBtn =
  "flex-1 rounded-lg py-1.5 text-xs font-medium transition disabled:opacity-50";

function ChildRow({ eventId, child }: { eventId: string; child: ParentChildRow }) {
  const [pending, startTransition] = useTransition();
  const locked = isFinalized(child.status);

  function respond(intent: "confirm" | "decline") {
    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("playerId", child.playerId);
    fd.set("intent", intent);
    startTransition(async () => {
      await setChildAttendance(fd);
    });
  }

  const confirmed = child.status === "parent_confirmed" || child.status === "present";
  const declined = child.status === "parent_absent" || child.status === "absent";

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">
        {child.name}
      </span>
      {locked ? (
        <span
          className={`rounded-lg px-2 py-1 text-xs font-medium ${
            child.status === "present"
              ? "bg-[#8BC34A]/15 text-[#8BC34A]"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {child.status === "present" ? "Marked present" : "Marked absent"}
        </span>
      ) : (
        <div className="flex w-40 gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => respond("confirm")}
            className={`${baseBtn} ${
              confirmed
                ? "bg-[#8BC34A] text-black"
                : "border border-zinc-700 text-zinc-300"
            }`}
          >
            Going
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => respond("decline")}
            className={`${baseBtn} ${
              declined
                ? "bg-red-500 text-white"
                : "border border-zinc-700 text-zinc-300"
            }`}
          >
            Can&apos;t
          </button>
        </div>
      )}
    </div>
  );
}

export function ParentAttendanceList({ events }: { events: ParentEventRow[] }) {
  if (events.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
        No upcoming practices to confirm yet. Add your children under Kids, then
        check back once practices are scheduled.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.eventId}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="mb-2">
            <h2 className="font-semibold text-[#8BC34A]">{event.title}</h2>
            <p className="text-xs text-zinc-500">
              {event.when} · {event.venueName} ({event.region})
            </p>
          </div>
          <div className="divide-y divide-zinc-800">
            {event.children.map((child) => (
              <ChildRow key={child.playerId} eventId={event.eventId} child={child} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
