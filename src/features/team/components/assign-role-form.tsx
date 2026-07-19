"use client";

import { useActionState } from "react";
import { assignRole } from "@/features/admin/users/actions";
import { APP_ROLES } from "@/lib/roles";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";

const ROLE_HINT =
  "Staff, parent, and teen player are separate account types — assigning one removes the others.";

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
      <p className="text-xs text-zinc-500">{ROLE_HINT}</p>
      <input
        name="email"
        type="email"
        placeholder="person@email.com"
        required
        className={inputClass}
      />
      <select name="role" required className={inputClass} defaultValue="coach">
        {APP_ROLES.map((role) => (
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
