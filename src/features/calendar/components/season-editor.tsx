"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveSeason, updateSeason } from "@/features/calendar/actions";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";
const labelClass = "block text-xs text-zinc-400";

type Result = { ok?: boolean; error?: string; message?: string };

export function SeasonEditor({
  season,
}: {
  season: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    active: boolean;
  };
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<Result | null>(null);

  if (!season.active) {
    return (
      <p className="mb-2 text-xs text-amber-500/80">
        Archived — past practices kept; no new schedule changes.
      </p>
    );
  }

  function save(formData: FormData) {
    setState(null);
    formData.set("seasonId", season.id);
    startTransition(async () => {
      const res = await updateSeason(formData);
      setState(res);
      if (res?.ok) {
        setEditing(false);
        router.refresh();
      }
    });
  }

  function archive() {
    if (
      !confirm(
        `Archive "${season.name}"?\n\nUpcoming practices for every venue in this season will be removed. Past practices stay in the database. Everyone will be notified.`,
      )
    ) {
      return;
    }
    setState(null);
    const fd = new FormData();
    fd.set("seasonId", season.id);
    startTransition(async () => {
      const res = await archiveSeason(fd);
      setState(res);
      if (res?.ok) router.refresh();
    });
  }

  return (
    <div className="mb-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="text-xs text-[#8BC34A] underline"
        >
          {editing ? "Close" : "Edit season"}
        </button>
        <button
          type="button"
          onClick={archive}
          disabled={pending}
          className="text-xs text-red-400 underline disabled:opacity-50"
        >
          Archive season
        </button>
      </div>

      {editing && (
        <form action={save} className="mt-3 space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
          <label className={labelClass}>
            Season name
            <input
              name="name"
              defaultValue={season.name}
              required
              className={inputClass}
            />
          </label>
          <div className="flex gap-2">
            <label className={`${labelClass} flex-1`}>
              Start date
              <input
                type="date"
                name="startDate"
                defaultValue={season.startDate}
                required
                className={inputClass}
              />
            </label>
            <label className={`${labelClass} flex-1`}>
              End date
              <input
                type="date"
                name="endDate"
                defaultValue={season.endDate}
                required
                className={inputClass}
              />
            </label>
          </div>
          <p className="text-[11px] text-zinc-500">
            Changing dates does not auto-regenerate practices. Edit or remove
            venue slots below to update upcoming times.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[#8BC34A] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save season"}
          </button>
        </form>
      )}

      {state?.error && <p className="mt-1 text-xs text-red-400">{state.error}</p>}
      {state?.message && (
        <p className="mt-1 text-xs text-[#8BC34A]">{state.message}</p>
      )}
    </div>
  );
}
