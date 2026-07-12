import Link from "next/link";
import { redirect } from "next/navigation";
import { revokeStaffInvite } from "@/features/invites/actions";
import { InviteForm } from "@/features/invites/components/invite-form";
import { listPendingInvites } from "@/features/invites/queries";
import { ensureAppUser } from "@/lib/auth";
import { canAccessAdminHub, formatRole } from "@/lib/roles";

export default async function AdminInvitesPage() {
  const user = await ensureAppUser();
  if (!canAccessAdminHub(user.roles)) redirect("/dashboard");

  const invites = await listPendingInvites();

  return (
    <main>
      <Link href="/admin" className="mb-4 inline-block text-sm text-zinc-500">
        ← Admin
      </Link>
      <h1 className="mb-1 text-xl font-bold">Staff invites</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Pending invites are applied when the person signs in with the invited email.
      </p>

      {invites.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {invites.map((invite) => (
            <li
              key={invite.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
            >
              <p className="font-medium">{invite.email}</p>
              <p className="text-xs text-zinc-500">
                {formatRole(invite.role)} · invited by {invite.invitedBy}
              </p>
              <form action={revokeStaffInvite.bind(null, invite.id)} className="mt-2">
                <button
                  type="submit"
                  className="text-xs text-red-400 underline"
                >
                  Revoke invite
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-zinc-500">No pending invites.</p>
      )}

      <InviteForm />
    </main>
  );
}
