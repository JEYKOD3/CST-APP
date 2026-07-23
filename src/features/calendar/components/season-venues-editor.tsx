"use client";

import { useState, useTransition } from "react";
import { setSeasonVenues } from "@/features/calendar/actions";

type Venue = { id: string; name: string; region: string };
type Result = { ok?: boolean; error?: string; message?: string };

export function SeasonVenuesEditor({
  seasonId,
  venues,
  selectedIds,
}: {
  seasonId: string;
  venues: Venue[];
  selectedIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set(selectedIds));
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<Result | null>(null);

  const selectedNames = venues
    .filter((v) => selectedIds.includes(v.id))
    .map((v) => v.name);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    setState(null);
    const fd = new FormData();
    fd.set("seasonId", seasonId);
    for (const id of checked) fd.append("venueIds", id);
    startTransition(async () => {
      const res = await setSeasonVenues(fd);
      setState(res);
      if (res?.ok) setOpen(false);
    });
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-400">
          Venues:{" "}
          {selectedNames.length > 0 ? (
            <span className="text-zinc-300">{selectedNames.join(", ")}</span>
          ) : (
            <span className="text-amber-400">none attributed</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 text-xs text-[#8BC34A] underline"
        >
          {open ? "Close" : "Edit venues"}
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-zinc-800 p-2">
          {venues.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No active venues — add one in Venues first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {venues.map((v) => (
                <label
                  key={v.id}
                  className="flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300"
                >
                  <input
                    type="checkbox"
                    checked={checked.has(v.id)}
                    onChange={() => toggle(v.id)}
                    className="accent-[#8BC34A]"
                  />
                  {v.name} ({v.region})
                </label>
              ))}
            </div>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="rounded-lg bg-[#8BC34A] px-3 py-1 text-xs font-semibold text-black disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save venues"}
          </button>
          {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
        </div>
      )}
    </div>
  );
}
