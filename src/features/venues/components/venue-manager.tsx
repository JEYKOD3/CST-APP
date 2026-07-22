"use client";

import { useState, useTransition } from "react";
import { createVenue, setVenueActive, updateVenue } from "@/features/venues/actions";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";
const labelClass = "block text-xs text-zinc-400";

type Venue = {
  id: string;
  name: string;
  address: string;
  region: string;
  requiresCar: boolean;
  active: boolean;
};
type Result = { ok?: boolean; error?: string; message?: string };

export function VenueManager({ venues }: { venues: Venue[] }) {
  const [pending, startTransition] = useTransition();
  const [createState, setCreateState] = useState<Result | null>(null);
  const [rowState, setRowState] = useState<Result | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function run(
    fn: () => Promise<Result>,
    set: (r: Result | null) => void,
    onOk?: () => void,
  ) {
    set(null);
    startTransition(async () => {
      const res = await fn();
      set(res);
      if (res?.ok) onOk?.();
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-2 font-semibold">Add a venue</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            run(
              () => createVenue(new FormData(form)),
              setCreateState,
              () => form.reset(),
            );
          }}
          className="space-y-2"
        >
          <label className={labelClass}>
            Name
            <input name="name" placeholder="New court rental" required className={inputClass} />
          </label>
          <label className={labelClass}>
            Address
            <input name="address" placeholder="123 St, City, QC" required className={inputClass} />
          </label>
          <div className="flex items-end gap-2">
            <label className={`${labelClass} flex-1`}>
              Region
              <input name="region" placeholder="Brossard" required className={inputClass} />
            </label>
            <label className="flex items-center gap-1 pb-2 text-xs text-zinc-300">
              <input type="checkbox" name="requiresCar" className="accent-[#8BC34A]" />
              Needs car
            </label>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[#8BC34A] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
          >
            Add venue
          </button>
          {createState?.error && <p className="text-xs text-red-400">{createState.error}</p>}
          {createState?.message && (
            <p className="text-xs text-[#8BC34A]">{createState.message}</p>
          )}
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Venues
        </h2>
        <ul className="space-y-2">
          {venues.map((v) => (
            <li
              key={v.id}
              className={`rounded-xl border p-4 ${
                v.active ? "border-zinc-800 bg-zinc-900" : "border-zinc-800/60 bg-zinc-900/40"
              }`}
            >
              {editingId === v.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    run(
                      () => updateVenue(new FormData(form)),
                      setRowState,
                      () => setEditingId(null),
                    );
                  }}
                  className="space-y-2"
                >
                  <input type="hidden" name="id" value={v.id} />
                  <input name="name" defaultValue={v.name} required className={inputClass} />
                  <input name="address" defaultValue={v.address} required className={inputClass} />
                  <div className="flex items-end gap-2">
                    <input
                      name="region"
                      defaultValue={v.region}
                      required
                      className={`${inputClass} flex-1`}
                    />
                    <label className="flex items-center gap-1 pb-2 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        name="requiresCar"
                        defaultChecked={v.requiresCar}
                        className="accent-[#8BC34A]"
                      />
                      Needs car
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg bg-[#8BC34A] px-3 py-1 text-xs font-semibold text-black disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {v.name}
                        {!v.active && (
                          <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                            inactive
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {v.region} · {v.address}
                        {v.requiresCar ? " · needs car" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRowState(null);
                        setEditingId(v.id);
                      }}
                      className="text-xs text-[#8BC34A] underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => setVenueActive(v.id, !v.active), setRowState)}
                      className="text-xs text-zinc-400 underline disabled:opacity-50"
                    >
                      {v.active ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
        {rowState?.error && <p className="mt-2 text-xs text-red-400">{rowState.error}</p>}
      </section>
    </div>
  );
}
