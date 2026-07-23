import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import { canManageTeam } from "@/lib/roles";
import { AdminAddPlayerForm } from "@/features/admin/components/admin-add-player-form";

export default async function AdminPlayersPage() {
  const user = await ensureAppUser();
  if (!canManageTeam(user.roles)) redirect("/dashboard");

  return (
    <main className="space-y-6">
      <div>
        <Link href="/admin" className="cst-caption text-[var(--cst-muted)]">
          ← Admin
        </Link>
        <h1 className="cst-page-title mt-2">Players</h1>
      </div>
      <AdminAddPlayerForm />
    </main>
  );
}
