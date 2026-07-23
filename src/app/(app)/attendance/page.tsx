import { redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import { isParentAccount, isStaffAccount } from "@/lib/roles";
import {
  getParentAttendanceOverview,
  listCoachPractices,
} from "@/features/attendance/queries";
import {
  ParentAttendanceList,
  type ParentEventRow,
} from "@/features/attendance/components/parent-attendance-list";
import {
  CoachPracticeList,
  type CoachPracticeRow,
} from "@/features/attendance/components/coach-practice-list";
import { formatScheduleWhen } from "@/features/schedule/utils";

export default async function AttendancePage() {
  const user = await ensureAppUser();

  if (isStaffAccount(user.roles)) {
    const practices = await listCoachPractices();
    const rows: CoachPracticeRow[] = practices.map((p) => {
      const { day, time } = formatScheduleWhen(p.startsAt, p.endsAt);
      return {
        eventId: p.id,
        title: p.title,
        type: p.type,
        when: `${day} · ${time}`,
        venueName: p.venueName,
        region: p.region,
        confirmed: p.confirmed,
        declined: p.declined,
        finalized: p.finalized,
      };
    });

    return (
      <main>
        <h1 className="cst-page-title mb-1">Attendance</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Open a practice to finalize present / absent. No more texting lists.
        </p>
        <CoachPracticeList practices={rows} />
      </main>
    );
  }

  if (isParentAccount(user.roles)) {
    const overview = await getParentAttendanceOverview(user.id);
    const rows: ParentEventRow[] = overview.map((event) => {
      const { day, time } = formatScheduleWhen(event.startsAt, event.endsAt);
      return {
        eventId: event.id,
        title: event.title,
        type: event.type,
        when: `${day} · ${time}`,
        venueName: event.venueName,
        region: event.region,
        children: event.children.map((c) => ({
          playerId: c.playerId,
          name: `${c.firstName} ${c.lastName}`,
          status: c.status,
        })),
      };
    });

    return (
      <main>
        <h1 className="cst-page-title mb-1">Attendance</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Let coaches know ahead of time who&apos;s coming to each practice.
        </p>
        <ParentAttendanceList events={rows} />
      </main>
    );
  }

  redirect("/dashboard");
}
