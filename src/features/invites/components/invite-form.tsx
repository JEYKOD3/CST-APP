"use client";

import { useActionState } from "react";
import { createStaffInvite } from "@/features/invites/actions";
import { STAFF_INVITE_ROLES } from "@/lib/roles";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";

export function InviteForm() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; ok?: boolean } | null, formData: FormData) => {
      const result = await createStaffInvite(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form action={action} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="font-semibold">Invite staff</h2>
      <p className="text-xs text-zinc-500">
        They receive the role automatically when they sign in with this email.
      </p>
      <input
        name="email"
        type="email"
        placeholder="coach@email.com"
        required
        className={inputClass}
      />
      <select name="role" required className={inputClass} defaultValue="coach">
        {STAFF_INVITE_ROLES.map((role) => (
          <option key={role} value={role}>
            {role.replace("_", " ")}
          </option>
        ))}
      </select>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.ok && (
        <p className="text-sm text-[#8BC34A]">Invite sent — pending sign-in.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#8BC34A] py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send invite"}
      </button>
    </form>
  );
}
