"use client";

import { useActionState } from "react";
import { inviteUser } from "@/features/admin/invites/actions";
import { APP_ROLES } from "@/lib/roles";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";

export function InviteUserForm() {
  const [state, action, pending] = useActionState(
    async (
      _prev: { error?: string; ok?: boolean; message?: string } | null,
      formData: FormData,
    ) => {
      const result = await inviteUser(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form
      action={action}
      className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <h2 className="font-semibold">Invite by email</h2>
      <p className="text-xs text-zinc-500">
        Pre-assign a role before they sign up — including super admin. They get a
        Clerk invitation email to create their account.
      </p>
      <input
        name="email"
        type="email"
        placeholder="coach@email.com"
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
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <input name="sendEmail" type="checkbox" defaultChecked className="rounded" />
        Send invitation email now
      </label>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.message && (
        <p className="text-sm text-[#8BC34A]">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#8BC34A] py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {pending ? "Sending…" : "Invite"}
      </button>
    </form>
  );
}
