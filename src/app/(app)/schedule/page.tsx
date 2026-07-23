import { ensureAppUser } from "@/lib/auth";
import { canManageSchedule, isStaffAccount, PLAYER_LEVELS } from "@/lib/roles";
import { getAgenda, listVenues } from "@/features/calendar/queries";
import { MonthSchedule } from "@/features/calendar/components/month-schedule";
import { zonedTimeToUtc } from "@/lib/calendar";
import type { PlayerLevel } from "@/lib/roles";

type SearchParams = {
  year?: string;
  month?: string;
  day?: string;
  level?: string;
  venue?: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function torontoParts(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await ensureAppUser();
  const sp = await searchParams;
  const today = torontoParts();

  const year = Math.min(
    Math.max(Number(sp.year) || today.year, today.year - 1),
    today.year + 3,
  );
  const month = Math.min(Math.max(Number(sp.month) || today.month, 1), 12);

  const level = (PLAYER_LEVELS as readonly string[]).includes(sp.level ?? "")
    ? (sp.level as PlayerLevel)
    : undefined;

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const from = zonedTimeToUtc(`${year}-${pad(month)}-01`, "00:00");
  const to = zonedTimeToUtc(
    `${year}-${pad(month)}-${pad(daysInMonth)}`,
    "23:59",
  );

  // Default selected day: today if in this month, else none
  let selectedDay = sp.day ?? null;
  if (!selectedDay) {
    if (year === today.year && month === today.month) {
      selectedDay = `${today.year}-${pad(today.month)}-${pad(today.day)}`;
    }
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDay)) {
    selectedDay = null;
  }

  const [venues, events] = await Promise.all([
    listVenues(),
    getAgenda({ from, to, level, venueId: sp.venue }),
  ]);

  return (
    <main>
      <MonthSchedule
        year={year}
        month={month}
        selectedDay={selectedDay}
        level={level ?? ""}
        venueId={sp.venue ?? ""}
        venues={venues}
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          level: e.level,
          startsAt: e.startsAt,
          endsAt: e.endsAt,
          canceled: e.canceled,
          venueName: e.venueName,
          region: e.region,
          address: e.address,
          coaches: e.coaches,
        }))}
        showCoaches={isStaffAccount(user.roles)}
        canManage={canManageSchedule(user.roles)}
      />
    </main>
  );
}
