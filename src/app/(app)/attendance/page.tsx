import { ensureAppUser } from "@/lib/auth";
import { isStaffAccount } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function AttendancePage() {
  const user = await ensureAppUser();
  if (!isStaffAccount(user.roles)) redirect("/dashboard");

  return (
    <main>
      <h1 className="mb-1 text-xl font-bold">Attendance</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Per-practice roster for Ghaida & Mohammad — Sprint 2 adds the full
        check-in flow.
      </p>
      <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
        Open a session from Schedule, then mark present / absent for each player.
        Parents will confirm ahead of time; coaches finalize at practice.
      </p>
    </main>
  );
}
