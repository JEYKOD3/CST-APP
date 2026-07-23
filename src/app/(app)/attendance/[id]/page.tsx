import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import { isStaffAccount } from "@/lib/roles";
import { getEventRoster } from "@/features/attendance/queries";
import {
  CoachRoster,
  type CoachRosterRow,
} from "@/features/attendance/components/coach-roster";
import { formatScheduleWhen } from "@/features/schedule/utils";

export default async function AttendanceRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await ensureAppUser();
  if (!isStaffAccount(user.roles)) redirect("/dashboard");

  const { id } = await params;
  const { event, rows } = await getEventRoster(id);
  if (!event) notFound();

  const { day, time } = formatScheduleWhen(event.startsAt, event.endsAt);
  const rosterRows: CoachRosterRow[] = rows.map((r) => ({
    playerId: r.playerId,
    name: `${r.firstName} ${r.lastName}`,
    level: r.level,
    status: r.status,
  }));

  return (
    <main>
      <Link href="/attendance" className="text-xs text-zinc-500">
        ← All practices
      </Link>
      <h1 className="cst-page-title mb-1 mt-2">{event.title}</h1>
      <p className="mb-6 text-sm text-zinc-400">
        {day} · {time} · {event.venueName} ({event.region})
      </p>
      <CoachRoster eventId={event.id} rows={rosterRows} />
    </main>
  );
}
