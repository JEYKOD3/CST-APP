"use client";

import { useState, useTransition } from "react";
import {
  createSeason,
  createSeriesAndGenerate,
  createSinglePractice,
  loadBrossardHours,
} from "@/features/calendar/actions";
import { PLAYER_LEVELS } from "@/lib/roles";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";
const labelClass = "block text-xs text-zinc-400";

type Venue = { id: string; name: string; region: string };
type Season = { id: string; name: string };

const WEEKDAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

type Result = { ok?: boolean; error?: string; message?: string };

function Feedback({ state }: { state: Result | null }) {
  if (!state) return null;
  if (state.error) return <p className="text-xs text-red-400">{state.error}</p>;
  if (state.message)
    return <p className="text-xs text-[#8BC34A]">{state.message}</p>;
  return null;
}

export function ScheduleManager({
  venues,
  seasons,
}: {
  venues: Venue[];
  seasons: Season[];
}) {
  const [pending, startTransition] = useTransition();
  const [seasonState, setSeasonState] = useState<Result | null>(null);
  const [seriesState, setSeriesState] = useState<Result | null>(null);
  const [singleState, setSingleState] = useState<Result | null>(null);
  const [brossardState, setBrossardState] = useState<Result | null>(null);

  function submit(
    fd: FormData,
    fn: (fd: FormData) => Promise<Result>,
    set: (r: Result | null) => void,
    form?: HTMLFormElement,
  ) {
    set(null);
    startTransition(async () => {
      const res = await fn(fd);
      set(res);
      if (res?.ok && form) form.reset();
    });
  }

  return (
    <div className="space-y-6">
      {/* One-tap Brossard hours */}
      <section className="rounded-xl border border-[#8BC34A]/40 bg-zinc-900 p-4">
        <h2 className="mb-1 font-semibold">Quick load: Brossard hours</h2>
        <p className="mb-3 text-xs text-zinc-400">
          Loads the standard Brossard training schedule in one tap — Summer
          (Mon/Tue/Wed 8–10 PM, Sat 1:30–3:30 PM, Sun 1–3 PM) through Sep 30, and
          Winter Sundays 3:15–5:15 PM. Safe to tap again; existing slots are
          skipped.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setBrossardState(null);
            startTransition(async () => {
              setBrossardState(await loadBrossardHours());
            });
          }}
          className="rounded-lg bg-[#8BC34A] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
        >
          {pending ? "Loading…" : "Load Brossard hours"}
        </button>
        <div className="mt-1">
          <Feedback state={brossardState} />
        </div>
      </section>

      {/* Create season */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-2 font-semibold">1. Create a season</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(new FormData(e.currentTarget), createSeason, setSeasonState, e.currentTarget);
          }}
          className="space-y-2"
        >
          <label className={labelClass}>
            Season name
            <input name="name" placeholder="Summer 2026" required className={inputClass} />
          </label>
          <div className="flex gap-2">
            <label className={`${labelClass} flex-1`}>
              Start date
              <input type="date" name="startDate" required className={inputClass} />
            </label>
            <label className={`${labelClass} flex-1`}>
              End date
              <input type="date" name="endDate" required className={inputClass} />
            </label>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[#8BC34A] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
          >
            Create season
          </button>
          <Feedback state={seasonState} />
        </form>
      </section>

      {/* Recurring practices */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-2 font-semibold">2. Generate recurring practices</h2>
        {seasons.length === 0 ? (
          <p className="text-xs text-zinc-500">Create a season first.</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(new FormData(e.currentTarget), createSeriesAndGenerate, setSeriesState, e.currentTarget);
            }}
            className="space-y-2"
          >
            <label className={labelClass}>
              Season
              <select name="seasonId" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Select season
                </option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Venue
              <select name="venueId" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Select venue
                </option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.region})
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Title
              <input name="title" placeholder="Beginners group" required className={inputClass} />
            </label>
            <div className="flex gap-2">
              <label className={`${labelClass} flex-1`}>
                Level
                <select name="level" className={inputClass} defaultValue="">
                  <option value="">All levels</option>
                  {PLAYER_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l[0].toUpperCase() + l.slice(1)}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`${labelClass} flex-1`}>
                Type
                <select name="type" className={inputClass} defaultValue="class">
                  <option value="class">Class</option>
                  <option value="camp">Camp</option>
                  <option value="elite">Elite</option>
                </select>
              </label>
            </div>
            <div>
              <span className={labelClass}>Weekdays</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {WEEKDAY_OPTIONS.map((d) => (
                  <label
                    key={d.value}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-300"
                  >
                    <input type="checkbox" name="days" value={d.value} className="accent-[#8BC34A]" />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <label className={`${labelClass} flex-1`}>
                Start time
                <input type="time" name="startTime" required className={inputClass} />
              </label>
              <label className={`${labelClass} flex-1`}>
                End time
                <input type="time" name="endTime" required className={inputClass} />
              </label>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#8BC34A] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
            >
              Generate practices
            </button>
            <Feedback state={seriesState} />
          </form>
        )}
      </section>

      {/* Single practice */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="mb-2 font-semibold">3. Add a one-off practice</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(new FormData(e.currentTarget), createSinglePractice, setSingleState, e.currentTarget);
          }}
          className="space-y-2"
        >
          <label className={labelClass}>
            Venue
            <select name="venueId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                Select venue
              </option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.region})
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Title
            <input name="title" placeholder="Makeup session" required className={inputClass} />
          </label>
          <div className="flex gap-2">
            <label className={`${labelClass} flex-1`}>
              Level
              <select name="level" className={inputClass} defaultValue="">
                <option value="">All levels</option>
                {PLAYER_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l[0].toUpperCase() + l.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <label className={`${labelClass} flex-1`}>
              Date
              <input type="date" name="date" required className={inputClass} />
            </label>
          </div>
          <div className="flex gap-2">
            <label className={`${labelClass} flex-1`}>
              Start time
              <input type="time" name="startTime" required className={inputClass} />
            </label>
            <label className={`${labelClass} flex-1`}>
              End time
              <input type="time" name="endTime" required className={inputClass} />
            </label>
          </div>
          <label className={labelClass}>
            Notes (optional)
            <input name="notes" className={inputClass} />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[#8BC34A] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
          >
            Add practice
          </button>
          <Feedback state={singleState} />
        </form>
      </section>
    </div>
  );
}
