import type { ReactNode } from "react";
import Link from "next/link";
import { ensureAppUser } from "@/lib/auth";
import {
  canManageSchedule,
  canManageTeam,
  formatRoleGroup,
  isParentAccount,
  isStaffAccount,
} from "@/lib/roles";
import { canReviewRegistrations } from "@/lib/registration";
import { listNotifications } from "@/features/notifications/queries";
import { getAgenda } from "@/features/calendar/queries";
import { formatTimeRange } from "@/lib/calendar";

function QuickAction({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)] px-2 text-center active:scale-[0.98]"
    >
      <span className="text-[var(--cst-green)]">{icon}</span>
      <span className="text-xs font-medium text-zinc-100">{label}</span>
    </Link>
  );
}

function IconCalendar() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function IconKids() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconRegister() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M16 11h6" />
    </svg>
  );
}
function IconAdmin() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function IconPayments() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

export default async function DashboardPage() {
  const user = await ensureAppUser();
  const greeting = user.displayName ?? user.email.split("@")[0];
  const recent = await listNotifications(user.id, 5);
  const unread = recent.filter((n) => n.readAt === null);

  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + 14);
  const upcoming = (await getAgenda({ from, to, limit: 3 })).filter(
    (e) => !e.canceled,
  );

  const actions: { href: string; label: string; icon: ReactNode }[] = [
    { href: "/schedule", label: "Schedule", icon: <IconCalendar /> },
  ];
  if (isParentAccount(user.roles)) {
    actions.push(
      { href: "/attendance", label: "Attend", icon: <IconCheck /> },
      { href: "/children", label: "Kids", icon: <IconKids /> },
      { href: "/register", label: "Register", icon: <IconRegister /> },
    );
  }
  if (isStaffAccount(user.roles)) {
    actions.push({ href: "/attendance", label: "Attend", icon: <IconCheck /> });
    if (canManageSchedule(user.roles)) {
      actions.push({
        href: "/schedule/manage",
        label: "Manage",
        icon: <IconAdmin />,
      });
    }
    if (canReviewRegistrations(user.roles)) {
      actions.push({
        href: "/payments",
        label: "Payments",
        icon: <IconPayments />,
      });
    }
    if (canManageTeam(user.roles)) {
      actions.push({ href: "/admin", label: "Admin", icon: <IconAdmin /> });
    }
  }

  // Cap at 4 tiles for one glance (hierarchy + progressive disclosure).
  const quick = actions.slice(0, 4);

  return (
    <main>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
          Hi, {greeting}
        </h1>
        <p className="text-sm text-[var(--cst-muted)]">
          {formatRoleGroup(user.roles)}
        </p>
      </div>

      {unread.length > 0 && (
        <Link
          href="/notifications"
          className="mb-5 flex items-center gap-3 rounded-2xl border border-[var(--cst-green)]/25 bg-[var(--cst-green-dim)] p-4"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--cst-green)]/20 text-[var(--cst-green)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 11v-1a9 9 0 0 1 18 0v1" />
              <path d="M21 15H3l2 5h14z" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[var(--cst-green)]">
              {unread.length} new update{unread.length > 1 ? "s" : ""}
            </span>
            <span className="block truncate text-xs text-zinc-300">
              {unread[0].title}
            </span>
          </span>
          <span className="text-[var(--cst-green)]" aria-hidden>
            →
          </span>
        </Link>
      )}

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-200">
          Quick actions
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {quick.map((a) => (
            <QuickAction
              key={a.href + a.label}
              href={a.href}
              label={a.label}
              icon={a.icon}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-zinc-200">Upcoming</h2>
          <Link
            href="/schedule"
            className="text-xs font-medium text-[var(--cst-green)]"
          >
            View all
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)] px-4 py-6 text-center text-sm text-[var(--cst-muted)]">
            No practices in the next 2 weeks.
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((event) => {
              const d = event.startsAt;
              const mon = d.toLocaleString("en-CA", {
                month: "short",
                timeZone: "America/Toronto",
              });
              const day = d.toLocaleString("en-CA", {
                day: "numeric",
                timeZone: "America/Toronto",
              });
              const weekday = d.toLocaleString("en-CA", {
                weekday: "short",
                timeZone: "America/Toronto",
              });
              return (
                <li key={event.id}>
                  <Link
                    href={`/schedule/${event.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--cst-border)] bg-[var(--cst-surface)] p-3 active:scale-[0.99]"
                  >
                    <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--cst-green)] text-[11px] font-bold leading-tight text-black">
                      <span>{mon.toUpperCase()}</span>
                      <span className="text-lg leading-none">{day}</span>
                      <span>{weekday.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-zinc-50">
                        {event.title}
                      </p>
                      <p className="truncate text-xs text-[var(--cst-green)]">
                        {formatTimeRange(event.startsAt, event.endsAt)}
                      </p>
                      <p className="truncate text-xs text-[var(--cst-muted)]">
                        {event.venueName}
                        {event.region && event.region !== event.venueName
                          ? ` · ${event.region}`
                          : ""}
                      </p>
                    </div>
                    <span className="text-[var(--cst-green)]" aria-hidden>
                      →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
