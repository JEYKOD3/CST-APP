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
      const marked = p.finalized;
      return {
        eventId: p.id,
        title: p.title,
        when: `${day} · ${time}`,
        venueName: p.venueName,
        confirmed: p.confirmed,
        declined: p.declined,
        marked,
        needsAction: p.confirmed > 0 && marked < p.confirmed,
      };
    });

    return (
      <main>
        <h1 className="cst-page-title mb-6">Attendance</h1>
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
        <h1 className="cst-page-title mb-6">Attendance</h1>
        <ParentAttendanceList events={rows} />
      </main>
    );
  }

  redirect("/dashboard");
}
