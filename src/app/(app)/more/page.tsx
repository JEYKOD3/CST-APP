import Link from "next/link";
import { ensureAppUser } from "@/lib/auth";

export default async function MorePage() {
  const user = await ensureAppUser();

  return (
    <main>
      <h1 className="mb-1 text-xl font-bold">More</h1>
      <p className="mb-6 text-sm text-zinc-400">{user.email}</p>

      <ul className="space-y-2 text-sm">
        {[
          { label: "Register (summer camp)", href: "#", soon: true },
          { label: "Notices", href: "#", soon: true },
          { label: "Settings", href: "#", soon: true },
        ].map((item) => (
          <li key={item.label}>
            <span className="block rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-400">
              {item.label}
              {item.soon && (
                <span className="ml-2 text-xs text-zinc-600">Sprint 2+</span>
              )}
            </span>
          </li>
        ))}
        <li>
          <Link
            href="/"
            className="block rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-300"
          >
            Public home page
          </Link>
        </li>
      </ul>
    </main>
  );
}
