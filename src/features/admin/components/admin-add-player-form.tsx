"use client";

import { useActionState } from "react";
import { adminAddPlayer } from "@/features/admin/users/actions";
import { PLAYER_LEVELS } from "@/lib/roles";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";

export function AdminAddPlayerForm() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; ok?: boolean } | null, formData: FormData) => {
      const result = await adminAddPlayer(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form
      action={action}
      className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <h2 className="font-semibold">Add player for a parent</h2>
      <p className="text-xs text-zinc-500">
        Parent must have signed in at least once. Use Invite above for new parents.
      </p>
      <input
        name="parentEmail"
        type="email"
        placeholder="parent@email.com"
        required
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          name="firstName"
          placeholder="First name"
          required
          className={inputClass}
        />
        <input
          name="lastName"
          placeholder="Last name"
          required
          className={inputClass}
        />
      </div>
      <select name="level" required className={inputClass} defaultValue="">
        <option value="" disabled>
          Level
        </option>
        {PLAYER_LEVELS.map((level) => (
          <option key={level} value={level}>
            {level}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <input name="isTeen" type="checkbox" className="rounded" />
        Teenager with own login (optional)
      </label>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.ok && (
        <p className="text-sm text-[#8BC34A]">Player added.</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#8BC34A] py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add player"}
      </button>
    </form>
  );
}
