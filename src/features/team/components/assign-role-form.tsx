"use client";

import { useActionState } from "react";
import { assignRole } from "@/features/team/actions";
import { APP_ROLES } from "@/lib/roles";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";

export function AssignRoleForm() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; ok?: boolean } | null, formData: FormData) => {
      const result = await assignRole(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form action={action} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="font-semibold">Add role</h2>
      <input
        name="email"
        type="email"
        placeholder="person@email.com"
        required
        className={inputClass}
      />
      <select name="role" required className={inputClass} defaultValue="coach">
        {APP_ROLES.filter((r) => r !== "player").map((role) => (
          <option key={role} value={role}>
            {role.replace("_", " ")}
          </option>
        ))}
      </select>
      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#8BC34A] py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {pending ? "Saving…" : "Assign role"}
      </button>
    </form>
  );
}
