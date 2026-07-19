"use client";

import { useTransition } from "react";
import { finalizeAttendance } from "@/features/attendance/actions";
import {
  type AttendanceStatus,
  formatAttendanceStatus,
} from "@/lib/attendance";

export type CoachRosterRow = {
  playerId: string;
  name: string;
  level: string;
  status: AttendanceStatus;
};

const baseBtn =
  "rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50";

function RosterRow({ eventId, row }: { eventId: string; row: CoachRosterRow }) {
  const [pending, startTransition] = useTransition();

  function finalize(result: "present" | "absent") {
    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("playerId", row.playerId);
    fd.set("result", result);
    startTransition(async () => {
      await finalizeAttendance(fd);
    });
  }

  const declinedByParent = row.status === "parent_absent";

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-200">{row.name}</p>
        <p className="text-xs text-zinc-500">
          {row.level} · {formatAttendanceStatus(row.status)}
          {declinedByParent ? " (parent)" : ""}
        </p>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={pending}
          onClick={() => finalize("present")}
          className={`${baseBtn} ${
            row.status === "present"
              ? "bg-[#8BC34A] text-black"
              : "border border-zinc-700 text-zinc-300"
          }`}
        >
          Present
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => finalize("absent")}
          className={`${baseBtn} ${
            row.status === "absent"
              ? "bg-red-500 text-white"
              : "border border-zinc-700 text-zinc-300"
          }`}
        >
          Absent
        </button>
      </div>
    </div>
  );
}

export function CoachRoster({
  eventId,
  rows,
}: {
  eventId: string;
  rows: CoachRosterRow[];
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
        No players yet. Players appear here once parents confirm, or mark them
        present as they arrive.
      </p>
    );
  }

  return (
    <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900 px-4">
      {rows.map((row) => (
        <RosterRow key={row.playerId} eventId={eventId} row={row} />
      ))}
    </div>
  );
}
