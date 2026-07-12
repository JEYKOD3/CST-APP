import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import { canManageTeam, formatRole } from "@/lib/roles";
import { removeRole } from "@/features/team/actions";
import { AssignRoleForm } from "@/features/team/components/assign-role-form";
import { listTeamMembers } from "@/features/team/queries";

export default async function TeamPage() {
  const user = await ensureAppUser();
  if (!canManageTeam(user.roles)) redirect("/dashboard");

  const byUser = await listTeamMembers();

  return (
    <main>
      <Link href="/admin" className="mb-4 inline-block text-sm text-zinc-500">
        ← Admin
      </Link>
      <h1 className="mb-1 text-xl font-bold">Team</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Coaches and admins are modifiable — availability changes with the schedule.
      </p>

      <ul className="mb-4 space-y-2">
        {Object.values(byUser).map((member) => (
          <li
            key={member.userId}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
          >
            <p className="font-medium">{member.name ?? member.email}</p>
            <p className="text-xs text-zinc-500">{member.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {member.roles.map((role) => (
                <form
                  key={role}
                  action={removeRole.bind(null, member.userId, role)}
                  className="inline"
                >
                  <button
                    type="submit"
                    className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs capitalize text-zinc-300"
                  >
                    {formatRole(role)} ×
                  </button>
                </form>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <AssignRoleForm />
    </main>
  );
}
