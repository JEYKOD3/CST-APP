import Link from "next/link";
import { ensureAppUser } from "@/lib/auth";
import {
  canManageSchedule,
  canManageTeam,
  isParentAccount,
  isStaffAccount,
} from "@/lib/roles";
import { canReviewRegistrations } from "@/lib/registration";

type Row = { label: string; href: string; hint?: string };

export default async function MorePage() {
  const user = await ensureAppUser();

  const rows: Row[] = [];

  if (isParentAccount(user.roles)) {
    rows.push({ label: "My children", href: "/children" });
    rows.push({ label: "Summer registration", href: "/register" });
  }
  if (isStaffAccount(user.roles) && canManageSchedule(user.roles)) {
    rows.push({ label: "Manage schedule", href: "/schedule/manage" });
    rows.push({ label: "Venues", href: "/schedule/venues" });
  }
  if (canReviewRegistrations(user.roles)) {
    rows.push({ label: "Payment queue", href: "/payments" });
  }
  if (canManageTeam(user.roles)) {
    rows.push({ label: "Admin hub", href: "/admin" });
  }

  rows.push({ label: "Notifications", href: "/notifications" });
  rows.push({
    label: "Notices",
    href: "#",
    hint: "Coming soon",
  });
  rows.push({ label: "Public home page", href: "/" });

  return (
    <main>
      <h1 className="cst-page-title mb-1">More</h1>
      <p className="cst-muted mb-8 truncate">{user.email}</p>

      <ul className="divide-y divide-[var(--cst-border)] overflow-hidden rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)]">
        {rows.map((item) => (
          <li key={item.label}>
            {item.href === "#" ? (
              <span className="flex items-center justify-between px-5 py-4 text-[length:var(--cst-text-base)] text-[var(--cst-faint)]">
                {item.label}
                {item.hint && (
                  <span className="cst-caption">{item.hint}</span>
                )}
              </span>
            ) : (
              <Link
                href={item.href}
                className="flex items-center justify-between px-5 py-4 text-[length:var(--cst-text-base)] text-zinc-100 active:bg-zinc-900"
              >
                {item.label}
                <span className="text-[var(--cst-green)]" aria-hidden>
                  →
                </span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
