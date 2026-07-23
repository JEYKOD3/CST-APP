"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatLevel,
  formatTimeRange,
  WEEKDAYS_SHORT,
} from "@/lib/calendar";
import { PLAYER_LEVELS } from "@/lib/roles";

export type CalendarEvent = {
  id: string;
  title: string;
  level: string | null;
  startsAt: Date | string;
  endsAt: Date | string;
  canceled: boolean;
  venueName: string;
  region: string;
  address: string;
  coaches: { userId: string; name: string }[];
};

type Venue = { id: string; name: string; region: string };

const selectClass =
  "w-full appearance-none rounded-xl border border-[var(--cst-border)] bg-[var(--cst-surface)] px-3 py-2.5 text-[length:var(--cst-text-sm)] text-zinc-100";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDayKey(d: Date) {
  // Club calendar day in America/Toronto
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function asDate(v: Date | string) {
  return v instanceof Date ? v : new Date(v);
}

export function MonthSchedule({
  year,
  month,
  selectedDay,
  level,
  venueId,
  venues,
  events,
  showCoaches,
  canManage,
}: {
  year: number;
  month: number; // 1–12
  selectedDay: string | null; // YYYY-MM-DD
  level: string;
  venueId: string;
  venues: Venue[];
  events: CalendarEvent[];
  showCoaches: boolean;
  canManage: boolean;
}) {
  const router = useRouter();

  const years = Array.from({ length: 5 }, (_, i) => year - 1 + i);

  function push(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const next = {
      year: String(year),
      month: String(month),
      day: selectedDay ?? undefined,
      level: level || undefined,
      venue: venueId || undefined,
      ...patch,
    };
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
    }
    router.push(`/schedule?${params.toString()}`);
  }

  // Count events per day key
  const countByDay = new Map<string, number>();
  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    if (e.canceled) continue;
    const key = toDayKey(asDate(e.startsAt));
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    const list = byDay.get(key) ?? [];
    list.push(e);
    byDay.set(key, list);
  }

  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = toDayKey(new Date());
  const dayEvents = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <h1 className="cst-page-title">Schedule</h1>
        {canManage && (
          <Link
            href="/schedule/manage"
            className="shrink-0 rounded-xl bg-[var(--cst-green)] px-3 py-2 text-[length:var(--cst-text-xs)] font-semibold text-black"
          >
            Manage
          </Link>
        )}
      </div>

      {/* Month / year */}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="cst-caption mb-1 block">Month</span>
          <select
            className={selectClass}
            value={month}
            onChange={(e) => {
              const m = e.target.value;
              push({
                month: m,
                day: undefined,
                year: String(year),
              });
            }}
          >
            {MONTHS.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="cst-caption mb-1 block">Year</span>
          <select
            className={selectClass}
            value={year}
            onChange={(e) =>
              push({ year: e.target.value, day: undefined })
            }
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="cst-caption mb-1 block">Level</span>
          <select
            className={selectClass}
            value={level}
            onChange={(e) =>
              push({ level: e.target.value || undefined })
            }
          >
            <option value="">All levels</option>
            {PLAYER_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {formatLevel(lvl)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="cst-caption mb-1 block">Venue</span>
          <select
            className={selectClass}
            value={venueId}
            onChange={(e) =>
              push({ venue: e.target.value || undefined })
            }
          >
            <option value="">All venues</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Month grid */}
      <div className="rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)] p-3">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS_SHORT.map((d) => (
            <div
              key={d}
              className="text-center text-[11px] font-medium text-[var(--cst-faint)]"
              style={{ letterSpacing: "0.04em" }}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`e-${i}`} className="aspect-square" />;
            }
            const key = `${year}-${pad(month)}-${pad(day)}`;
            const count = countByDay.get(key) ?? 0;
            const selected = selectedDay === key;
            const isToday = todayKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => push({ day: key })}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl text-[length:var(--cst-text-sm)] transition ${
                  selected
                    ? "bg-[var(--cst-green)] font-semibold text-black"
                    : isToday
                      ? "bg-[var(--cst-green-dim)] font-semibold text-[var(--cst-green)]"
                      : "text-zinc-200 active:bg-zinc-800"
                }`}
              >
                <span>{day}</span>
                {count > 0 && (
                  <span
                    className={`mt-0.5 h-1 w-1 rounded-full ${
                      selected ? "bg-black/50" : "bg-[var(--cst-green)]"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail */}
      <section>
        <h2 className="cst-section-title mb-3">
          {selectedDay
            ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString("en-CA", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
            : "Select a day"}
        </h2>

        {!selectedDay ? (
          <p className="cst-muted rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)] px-4 py-6 text-center">
            Tap a date to see practices.
          </p>
        ) : dayEvents.length === 0 ? (
          <p className="cst-muted rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)] px-4 py-6 text-center">
            No practices this day.
          </p>
        ) : (
          <ul className="space-y-2">
            {dayEvents.map((event) => {
              const starts = asDate(event.startsAt);
              const ends = asDate(event.endsAt);
              return (
                <li key={event.id}>
                  <Link
                    href={`/schedule/${event.id}`}
                    className="block rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)] p-4 active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-zinc-50">
                          {event.title}
                        </p>
                        <p className="mt-0.5 text-[length:var(--cst-text-sm)] text-[var(--cst-green)]">
                          {formatTimeRange(starts, ends)}
                        </p>
                        <p className="cst-muted mt-1 truncate">
                          {event.venueName}
                          {event.region && event.region !== event.venueName
                            ? ` · ${event.region}`
                            : ""}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">
                        {formatLevel(event.level as never)}
                      </span>
                    </div>
                    {showCoaches && (
                      <p className="cst-caption mt-2">
                        {event.coaches.length > 0
                          ? event.coaches.map((c) => c.name).join(", ")
                          : "No coach yet"}
                      </p>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
