import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ensureAppUser } from "@/lib/auth";
import { canManageTeam, isStaffRole } from "@/lib/roles";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await ensureAppUser();

  const navItems = [
    { href: "/dashboard", label: "Home" },
    { href: "/schedule", label: "Schedule" },
    ...(user.roles.some(isStaffRole)
      ? [{ href: "/attendance", label: "Attendance" }]
      : [{ href: "/children", label: "Kids" }]),
    ...(canManageTeam(user.roles)
      ? [{ href: "/team", label: "Team" }]
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
        <UserButton />
      </header>
      {children}
      <BottomNav items={navItems} />
    </div>
  );
}
