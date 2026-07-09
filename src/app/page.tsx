import Image from "next/image";
import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col px-4 pb-8 pt-6">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/cst-logo.jpg"
            alt="CST Badminton"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <p className="text-lg font-bold text-[#8BC34A]">CST</p>
            <p className="text-xs text-zinc-400">Badminton Training Centre</p>
          </div>
        </div>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>

      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
        <p className="mb-1 text-sm font-semibold text-[#8BC34A]">
          Summer camp is live
        </p>
        <p className="text-sm text-zinc-300">
          All locations — schedules and notices sync here for everyone.
        </p>
      </section>

      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            className="mb-4 w-full rounded-xl bg-[#8BC34A] py-3 font-semibold text-black"
          >
            Sign in / Create account
          </button>
        </SignInButton>
        <p className="text-center text-xs text-zinc-500">
          Parents: one account for all your children
        </p>
      </Show>

      <Show when="signed-in">
        <Link
          href="/dashboard"
          className="mb-4 block w-full rounded-xl bg-[#8BC34A] py-3 text-center font-semibold text-black"
        >
          Open dashboard
        </Link>
      </Show>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {["Schedule", "Register", "Notices", "Contact"].map((label) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center text-zinc-300"
          >
            {label}
            <span className="mt-1 block text-xs text-zinc-600">Sprint 1+</span>
          </div>
        ))}
      </div>
    </main>
  );
}
