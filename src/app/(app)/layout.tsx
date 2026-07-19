import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ensureAppUser } from "@/lib/auth";
import {
  canManageTeam,
  isParentAccount,
  isStaffAccount,
} from "@/lib/roles";
import { canReviewRegistrations } from "@/lib/registration";
import { countUnread } from "@/features/notifications/queries";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureAppUser();
  const unread = await countUnread(user.id);

  const navItems = [
    { href: "/dashboard", label: "Home" },
    { href: "/schedule", label: "Schedule" },
    ...(isParentAccount(user.roles)
      ? [
          { href: "/children", label: "Kids" },
          { href: "/attendance", label: "Attend" },
          { href: "/register", label: "Register" },
        ]
      : []),
    ...(isStaffAccount(user.roles)
      ? [{ href: "/attendance", label: "Attendance" }]
      : []),
    ...(canReviewRegistrations(user.roles) && !canManageTeam(user.roles)
      ? [{ href: "/payments", label: "Payments" }]
      : []),
    ...(canManageTeam(user.roles)
      ? [{ href: "/admin", label: "Admin" }]
      : []),
    { href: "/more", label: "More" },
  ];

  return (
    <div className="mx-auto min-h-full w-full max-w-lg px-4 pb-24 pt-4">
      <header className="mb-5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/cst-logo.jpg"
            alt="CST"
            width={32}
            height={32}
            className="rounded-md"
          />
          <span className="text-sm font-bold text-[#8BC34A]">CST</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative text-zinc-300"
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
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8BC34A] px-1 text-[10px] font-bold text-black">
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
