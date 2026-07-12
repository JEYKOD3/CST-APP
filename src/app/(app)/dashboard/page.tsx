import Link from "next/link";
import { ensureAppUser } from "@/lib/auth";
import {
  canManageTeam,
  formatRoleGroup,
  isParentAccount,
  isPlayerAccount,
  isStaffAccount,
} from "@/lib/roles";

export default async function DashboardPage() {
  const user = await ensureAppUser();
  const greeting = user.displayName ?? user.email.split("@")[0];

  return (
    <main>
      <h1 className="mb-1 text-xl font-bold">Hi, {greeting}</h1>
      <p className="mb-6 text-sm text-zinc-400">{formatRoleGroup(user.roles)}</p>

      <section className="space-y-3">
        <Link
          href="/schedule"
          className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <h2 className="mb-1 font-semibold text-[#8BC34A]">Master schedule</h2>
          <p className="text-sm text-zinc-400">
            One plan for everyone — practices, camps, privates.
          </p>
        </Link>

        {isStaffAccount(user.roles) && (
          <Link
            href="/attendance"
            className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <h2 className="mb-1 font-semibold">Attendance</h2>
            <p className="text-sm text-zinc-400">
              Per-practice roster — who was present, no more texting lists.
            </p>
          </Link>
        )}

        {isParentAccount(user.roles) && (
          <Link
            href="/children"
            className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <h2 className="mb-1 font-semibold">My children</h2>
            <p className="text-sm text-zinc-400">
              Add all your kids under one parent account.
            </p>
          </Link>
        )}

        {isPlayerAccount(user.roles) && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-1 font-semibold">My training</h2>
            <p className="text-sm text-zinc-400">
              Teen player account — see Schedule for your sessions. Parents
              manage registration on their account.
            </p>
          </div>
        )}

        {canManageTeam(user.roles) && (
          <Link
            href="/team"
            className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <h2 className="mb-1 font-semibold">Team</h2>
            <p className="text-sm text-zinc-400">
              Add or remove coaches and admins — staff cannot also be parents.
            </p>
          </Link>
        )}
      </section>
    </main>
  );
}
