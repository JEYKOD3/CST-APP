"use client";

import { useState, useTransition } from "react";
import {
  assignCoach,
  cancelPractice,
  unassignCoach,
  updatePractice,
} from "@/features/calendar/actions";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";

type Venue = { id: string; name: string; region: string };
type Coach = { userId: string; name: string };

export type ManageEventData = {
  id: string;
  venueId: string;
  dateInput: string;
  startInput: string;
  endInput: string;
  notes: string;
  canceled: boolean;
  coaches: Coach[];
};

export function ManageEventPanel({
  event,
  venues,
  allCoaches,
}: {
  event: ManageEventData;
  venues: Venue[];
  allCoaches: Coach[];
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [coachToAdd, setCoachToAdd] = useState("");

  function run(fn: () => Promise<{ ok?: boolean; error?: string; message?: string }>) {
    setMsg(null);
    setErr(null);
    startTransition(async () => {
      const res = await fn();
      if (res?.error) setErr(res.error);
      else if (res?.message) setMsg(res.message);
    });
  }

  const assignedIds = new Set(event.coaches.map((c) => c.userId));
  const availableCoaches = allCoaches.filter((c) => !assignedIds.has(c.userId));

  return (
    <div className="mt-6 space-y-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      <h2 className="text-sm font-semibold text-amber-300">Admin controls</h2>

      <form
        action={(fd) => run(() => updatePractice(fd))}
        className="space-y-2"
      >
        <input type="hidden" name="eventId" value={event.id} />
        <label className="block text-xs text-zinc-400">
          Venue
          <select name="venueId" defaultValue={event.venueId} className={inputClass}>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.region})
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <label className="block flex-1 text-xs text-zinc-400">
            Date
            <input type="date" name="date" defaultValue={event.dateInput} className={inputClass} />
          </label>
          <label className="block text-xs text-zinc-400">
            Start
            <input type="time" name="startTime" defaultValue={event.startInput} className={inputClass} />
          </label>
          <label className="block text-xs text-zinc-400">
            End
            <input type="time" name="endTime" defaultValue={event.endInput} className={inputClass} />
          </label>
        </div>
        <label className="block text-xs text-zinc-400">
          Notes
          <input type="text" name="notes" defaultValue={event.notes} className={inputClass} />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#8BC34A] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
        >
          Save changes
        </button>
      </form>

      <div className="border-t border-zinc-800 pt-3">
        <p className="mb-2 text-xs font-medium text-zinc-300">Coaches</p>
        <div className="space-y-1">
          {event.coaches.length === 0 && (
            <p className="text-xs text-zinc-500">None assigned yet.</p>
          )}
          {event.coaches.map((c) => (
            <div key={c.userId} className="flex items-center justify-between gap-2">
              <span className="text-sm text-zinc-200">{c.name}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() => {
                    const fd = new FormData();
                    fd.set("eventId", event.id);
                    fd.set("coachUserId", c.userId);
                    return unassignCoach(fd);
                  })
                }
                className="text-xs text-red-400"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {availableCoaches.length > 0 && (
          <div className="mt-2 flex gap-2">
            <select
              value={coachToAdd}
              onChange={(e) => setCoachToAdd(e.target.value)}
              className={inputClass}
            >
              <option value="">Assign a coach…</option>
              {availableCoaches.map((c) => (
                <option key={c.userId} value={c.userId}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending || !coachToAdd}
              onClick={() => {
                const coachUserId = coachToAdd;
                setCoachToAdd("");
                run(() => {
                  const fd = new FormData();
                  fd.set("eventId", event.id);
                  fd.set("coachUserId", coachUserId);
                  return assignCoach(fd);
                });
              }}
              className="shrink-0 rounded-lg border border-zinc-700 px-3 text-xs text-zinc-200 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {!event.canceled && (
        <div className="border-t border-zinc-800 pt-3">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() => {
                const fd = new FormData();
                fd.set("eventId", event.id);
                return cancelPractice(fd);
              })
            }
            className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-400 disabled:opacity-50"
          >
            Cancel this practice
          </button>
        </div>
      )}

      {msg && <p className="text-xs text-[#8BC34A]">{msg}</p>}
      {err && <p className="text-xs text-red-400">{err}</p>}
    </div>
  );
}
