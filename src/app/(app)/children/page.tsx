import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { players } from "@/db/schema";
import { ensureAppUser } from "@/lib/auth";
import { AddChildForm } from "./add-child-form";
import { removeChild } from "./actions";

export default async function ChildrenPage() {
  const user = await ensureAppUser();
  const db = getDb();

  const children = await db
    .select()
    .from(players)
    .where(
      and(eq(players.parentUserId, user.id), eq(players.active, true)),
    );

  return (
    <main>
      <h1 className="mb-1 text-xl font-bold">My children</h1>
      <p className="mb-6 text-sm text-zinc-400">
        One parent account — add every child who trains at CST.
      </p>

      {children.length > 0 && (
        <ul className="mb-4 space-y-2">
          {children.map((child) => (
            <li
              key={child.id}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
            >
              <div>
                <p className="font-medium">
                  {child.firstName} {child.lastName}
                </p>
                <p className="text-xs capitalize text-zinc-500">
                  {child.level}
                  {child.isTeenSelfManaged ? " · teen account" : ""}
                </p>
              </div>
              <form action={removeChild.bind(null, child.id)}>
                <button
                  type="submit"
                  className="text-xs text-zinc-500 underline"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <AddChildForm />
    </main>
  );
}
