import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import { canManageTeam } from "@/lib/roles";
import { cancelPendingInvite } from "@/features/admin/invites/actions";
import { listPendingInvites } from "@/features/admin/invites/queries";
import { InviteUserForm } from "@/features/admin/components/invite-user-form";

export default async function AdminInvitesPage() {
  const user = await ensureAppUser();
  if (!canManageTeam(user.roles)) redirect("/dashboard");

  const pendingInvites = await listPendingInvites();

  return (
    <main className="space-y-6">
      <div>
        <Link href="/admin" className="cst-caption text-[var(--cst-muted)]">
          ← Admin
        </Link>
        <h1 className="cst-page-title mt-2">Invites</h1>
      </div>

      <InviteUserForm />

      {pendingInvites.length > 0 && (
        <section>
          <h2 className="cst-section-title mb-3">Pending</h2>
          <ul className="space-y-2">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)] px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-zinc-50">{invite.email}</p>
                  <p className="cst-caption mt-0.5 capitalize">
                    {invite.role.replace("_", " ")}
                    {invite.clerkInvitationId ? " · email sent" : ""}
                  </p>
                </div>
                <form action={cancelPendingInvite.bind(null, invite.id)}>
                  <button
                    type="submit"
                    className="text-[length:var(--cst-text-xs)] text-red-400"
                  >
                    Cancel
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
