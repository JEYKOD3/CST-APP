import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import { canAccessAdminHub } from "@/lib/roles";

export default async function AdminHubPage() {
  const user = await ensureAppUser();
  if (!canAccessAdminHub(user.roles)) redirect("/dashboard");

  return (
    <main>
      <h1 className="mb-1 text-xl font-bold">Admin</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Manage coaches, admins, and pending invites.
      </p>

      <section className="space-y-3">
        <Link
          href="/admin/invites"
          className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <h2 className="mb-1 font-semibold text-[#8BC34A]">Staff invites</h2>
          <p className="text-sm text-zinc-400">
            Invite coaches and admins before they sign in — roles apply on first login.
          </p>
        </Link>

        <Link
          href="/team"
          className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4"
        >
          <h2 className="mb-1 font-semibold">Team roles</h2>
          <p className="text-sm text-zinc-400">
            Add or remove roles for people who already have accounts.
          </p>
        </Link>
      </section>
    </main>
  );
}
