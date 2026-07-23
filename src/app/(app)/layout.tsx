import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { BottomNav, type NavItem } from "@/components/layout/bottom-nav";
import { ensureAppUser } from "@/lib/auth";
import {
  canManageTeam,
  isParentAccount,
  isStaffAccount,
} from "@/lib/roles";
import { countUnread } from "@/features/notifications/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureAppUser();
  const unread = await countUnread(user.id);

  // Max 5 primary tabs — everything else lives under More (progressive disclosure).
  const navItems: NavItem[] = isParentAccount(user.roles)
    ? [
        { href: "/dashboard", label: "Home", icon: "home" },
        { href: "/schedule", label: "Schedule", icon: "schedule" },
        { href: "/attendance", label: "Attend", icon: "attend" },
        { href: "/register", label: "Register", icon: "register" },
        { href: "/more", label: "More", icon: "more" },
      ]
    : isStaffAccount(user.roles)
      ? [
          { href: "/dashboard", label: "Home", icon: "home" },
          { href: "/schedule", label: "Schedule", icon: "schedule" },
          { href: "/attendance", label: "Attend", icon: "attend" },
          canManageTeam(user.roles)
            ? { href: "/admin", label: "Admin", icon: "admin" }
            : { href: "/schedule/manage", label: "Manage", icon: "admin" },
          { href: "/more", label: "More", icon: "more" },
        ]
      : [
          { href: "/dashboard", label: "Home", icon: "home" },
          { href: "/schedule", label: "Schedule", icon: "schedule" },
          { href: "/more", label: "More", icon: "more" },
        ];

  return (
    <div className="mx-auto min-h-full w-full max-w-lg px-4 pb-28 pt-3">
      <header className="mb-4 flex items-center justify-between gap-3">
        <Link href="/dashboard" className="flex min-w-0 items-center">
          <Image
            src="/cst-logo.jpg"
            alt="CST Badminton Training Centre"
            width={160}
            height={54}
            priority
            className="h-9 w-auto object-contain object-left"
          />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/notifications"
            aria-label={
              unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
            }
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-zinc-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--cst-green)] px-1 text-[10px] font-bold text-black">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <UserButton />
        </div>
      </header>
      {children}
      <BottomNav items={navItems} />
    </div>
  );
}
