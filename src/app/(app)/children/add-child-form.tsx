"use client";

import { useActionState } from "react";
import { addChild } from "./actions";
import { PLAYER_LEVELS } from "@/lib/roles";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";

export function AddChildForm() {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; ok?: boolean } | null, formData: FormData) => {
      const result = await addChild(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form action={action} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h2 className="font-semibold">Add a child</h2>
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
      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#8BC34A] py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {pending ? "Saving…" : "Add child"}
      </button>
    </form>
  );
}
