"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteFutureSeriesOccurrences,
  updateSeries,
} from "@/features/calendar/actions";
import { formatLevel, WEEKDAYS_SHORT } from "@/lib/calendar";
import { PLAYER_LEVELS } from "@/lib/roles";

type Venue = { id: string; name: string; region: string };
type Result = { ok?: boolean; error?: string; message?: string };

export type Slot = {
  id: string;
  venueId: string;
  venueName: string;
  title: string;
  level: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
  upcoming: number;
  nextLabel: string | null;
};

export function SeasonSlots({
  slots,
  venues,
}: {
  slots: Slot[];
  venues: Venue[];
}) {
  if (slots.length === 0) {
    return (
      <p className="text-xs text-zinc-500">
        No practice slots yet. Use “Generate recurring practices” above to add
        weekly times per venue.
      </p>
    );
  }

  // Group by venue (slots arrive sorted by venue name → day → time).
  const groups = new Map<string, Slot[]>();
  for (const s of slots) {
    const list = groups.get(s.venueName) ?? [];
    list.push(s);
    groups.set(s.venueName, list);
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([venueName, venueSlots]) => (
        <div key={venueName}>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {venueName}
          </p>
          <div className="space-y-1.5">
            {venueSlots.map((slot) => (
              <SlotRow key={slot.id} slot={slot} venues={venues} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SlotRow({ slot, venues }: { slot: Slot; venues: Venue[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<Result | null>(null);

  function save(formData: FormData) {
    setState(null);
    formData.set("seriesId", slot.id);
    startTransition(async () => {
      const res = await updateSeries(formData);
      setState(res);
      if (res?.ok) {
        setEditing(false);
        router.refresh();
      }
    });
  }

  function removeUpcoming() {
    if (
      !confirm(
        `Remove all upcoming practices for this slot?\n\n${WEEKDAYS_SHORT[slot.dayOfWeek]} ${slot.startTime}–${slot.endTime} · ${slot.venueName}\n\nPast practices are kept. Everyone will be notified.`,
      )
    ) {
      return;
    }
    setState(null);
    const fd = new FormData();
    fd.set("seriesId", slot.id);
    startTransition(async () => {
      const res = await deleteFutureSeriesOccurrences(fd);
      setState(res);
      if (res?.ok) router.refresh();
    });
  }

  if (!slot.active) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-zinc-500">
        <span className="line-through">
          {WEEKDAYS_SHORT[slot.dayOfWeek]} {slot.startTime}–{slot.endTime} ·{" "}
          {slot.title}
        </span>{" "}
        <span className="text-amber-500/70">(discontinued)</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 text-xs">
          <p className="font-medium text-zinc-200">
            {WEEKDAYS_SHORT[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
          </p>
          <p className="text-zinc-400">
            {slot.title} · {formatLevel(slot.level as never)}
          </p>
          <p className="mt-0.5 text-zinc-500">
            {slot.upcoming} upcoming
            {slot.nextLabel ? ` · next ${slot.nextLabel}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="text-xs text-[#8BC34A] underline"
          >
            {editing ? "Close" : "Edit"}
          </button>
          <button
            type="button"
            onClick={removeUpcoming}
            disabled={pending}
            className="text-xs text-red-400 underline disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      {editing && (
        <form action={save} className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
          <div>
            <label className="block text-[11px] text-zinc-500">Venue</label>
            <select
              name="venueId"
              defaultValue={slot.venueId}
              className="mt-0.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100"
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.region})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500">Title</label>
            <input
              name="title"
              defaultValue={slot.title}
              className="mt-0.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-zinc-500">Start</label>
              <input
                name="startTime"
                type="time"
                defaultValue={slot.startTime}
                className="mt-0.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-500">End</label>
              <input
                name="endTime"
                type="time"
                defaultValue={slot.endTime}
                className="mt-0.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-500">Level</label>
            <select
              name="level"
              defaultValue={slot.level ?? ""}
              className="mt-0.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-100"
            >
              <option value="">All levels</option>
              {PLAYER_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {formatLevel(lvl)}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-zinc-500">
            Saving updates all {slot.upcoming} upcoming practice(s) and notifies
            everyone. Past practices are unchanged.
          </p>

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[#8BC34A] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
          {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
        </form>
      )}

      {!editing && state?.error && (
        <p className="mt-1 text-xs text-red-400">{state.error}</p>
      )}
    </div>
  );
}
