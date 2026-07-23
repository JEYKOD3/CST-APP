import Link from "next/link";
import { redirect } from "next/navigation";
import { ensureAppUser } from "@/lib/auth";
import { canManageTeam } from "@/lib/roles";
import { listPendingInvites } from "@/features/admin/invites/queries";
import { listAllUsers } from "@/features/admin/users/queries";
import { listPendingRegistrations } from "@/features/registration/queries";

const tiles = [
  {
    href: "/payments",
    title: "Payments",
    subtitle: "Review registrations",
    key: "payments" as const,
  },
  {
    href: "/admin/invites",
    title: "Invites",
    subtitle: "Add coaches & staff",
    key: "invites" as const,
  },
  {
    href: "/admin/accounts",
    title: "Accounts",
    subtitle: "Roles & names",
    key: "accounts" as const,
  },
  {
    href: "/admin/players",
    title: "Players",
    subtitle: "Add a child",
    key: "players" as const,
  },
  {
    href: "/schedule/manage",
    title: "Schedule",
    subtitle: "Seasons & slots",
    key: "schedule" as const,
  },
];

export default async function AdminPage() {
  const user = await ensureAppUser();
  if (!canManageTeam(user.roles)) redirect("/dashboard");

  const [pendingInvites, allUsers, pendingRegistrations] = await Promise.all([
    listPendingInvites(),
    listAllUsers(),
    listPendingRegistrations(),
  ]);

  const badges: Record<string, number | undefined> = {
    payments: pendingRegistrations.length || undefined,
    invites: pendingInvites.length || undefined,
    accounts: Object.keys(allUsers).length || undefined,
  };

  return (
    <main>
      <h1 className="cst-page-title mb-6">Admin</h1>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="relative flex min-h-[7.5rem] flex-col justify-between rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)] p-4 active:scale-[0.98]"
          >
            {badges[tile.key] != null && (
              <span className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--cst-green)] px-1.5 text-[11px] font-bold text-black">
                {badges[tile.key]}
              </span>
            )}
            <span className="text-[length:var(--cst-text-base)] font-semibold text-zinc-50">
              {tile.title}
            </span>
            <span className="cst-muted">{tile.subtitle}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
