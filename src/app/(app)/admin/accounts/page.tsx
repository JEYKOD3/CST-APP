import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import { canManageTeam, formatRole, formatRoleGroup } from "@/lib/roles";
import { removeRole } from "@/features/admin/users/actions";
import { listAllUsers } from "@/features/admin/users/queries";
import { AssignRoleForm } from "@/features/admin/components/assign-role-form";
import { EditUserNameForm } from "@/features/admin/components/edit-user-name-form";

export default async function AdminAccountsPage() {
  const user = await ensureAppUser();
  if (!canManageTeam(user.roles)) redirect("/dashboard");

  const allUsers = await listAllUsers();
  const users = Object.values(allUsers);

  return (
    <main className="space-y-6">
      <div>
        <Link href="/admin" className="cst-caption text-[var(--cst-muted)]">
          ← Admin
        </Link>
        <h1 className="cst-page-title mt-2">Accounts</h1>
      </div>

      <AssignRoleForm />

      <ul className="space-y-2">
        {users.map((member) => (
          <li
            key={member.userId}
            className="rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)] px-4 py-3"
          >
            <p className="font-semibold text-zinc-50">
              {member.name ?? member.email}
            </p>
            <p className="cst-caption mt-0.5">{member.email}</p>
            <p className="cst-muted mt-1 capitalize">
              {formatRoleGroup(member.roles) ||
                member.roles.map(formatRole).join(" · ")}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {member.roles.map((role) => (
                <form
                  key={role}
                  action={removeRole.bind(null, member.userId, role)}
                  className="inline"
                >
                  <button
                    type="submit"
                    className="rounded-full bg-zinc-800 px-2.5 py-1 text-[length:var(--cst-text-xs)] capitalize text-zinc-300"
                  >
                    {formatRole(role)} ×
                  </button>
                </form>
              ))}
            </div>
            <EditUserNameForm
              userId={member.userId}
              currentName={member.name}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
