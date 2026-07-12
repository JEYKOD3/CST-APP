import { redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import { canManageTeam, formatRole, formatRoleGroup } from "@/lib/roles";
import { cancelPendingInvite } from "@/features/admin/invites/actions";
import { listPendingInvites } from "@/features/admin/invites/queries";
import { removeRole } from "@/features/admin/users/actions";
import { listAllUsers } from "@/features/admin/users/queries";
import { AdminAddPlayerForm } from "@/features/admin/components/admin-add-player-form";
import { AssignRoleForm } from "@/features/admin/components/assign-role-form";
import { EditUserNameForm } from "@/features/admin/components/edit-user-name-form";
import { InviteUserForm } from "@/features/admin/components/invite-user-form";

export default async function AdminPage() {
  const user = await ensureAppUser();
  if (!canManageTeam(user.roles)) redirect("/dashboard");

  const [pendingInvites, allUsers] = await Promise.all([
    listPendingInvites(),
    listAllUsers(),
  ]);

  const users = Object.values(allUsers);

  return (
    <main className="space-y-8">
      <div>
        <h1 className="mb-1 text-xl font-bold">Admin</h1>
        <p className="text-sm text-zinc-400">
          Invite staff, manage roles, edit accounts, and add players at scale.
          Super admins can promote or demote other super admins from here.
        </p>
      </div>

      <InviteUserForm />

      {pendingInvites.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">Pending invites</h2>
          <ul className="space-y-2">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{invite.email}</p>
                  <p className="text-xs capitalize text-zinc-500">
                    {invite.role.replace("_", " ")}
                    {invite.clerkInvitationId ? " · email sent" : " · saved only"}
                  </p>
                </div>
                <form action={cancelPendingInvite.bind(null, invite.id)}>
                  <button
                    type="submit"
                    className="text-xs text-zinc-500 hover:text-red-400"
                  >
                    Cancel
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold">Accounts ({users.length})</h2>
        <ul className="space-y-2">
          {users.map((member) => (
            <li
              key={member.userId}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
            >
              <p className="font-medium">{member.name ?? member.email}</p>
              <p className="text-xs text-zinc-500">{member.email}</p>
              <p className="mt-1 text-xs capitalize text-zinc-400">
                {formatRoleGroup(member.roles) || member.roles.map(formatRole).join(" · ")}
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
                      className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs capitalize text-zinc-300"
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
      </section>

      <AssignRoleForm />

      <AdminAddPlayerForm />
    </main>
  );
}
