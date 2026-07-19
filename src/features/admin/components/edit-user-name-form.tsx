"use client";

import { useActionState } from "react";
import { updateUserDisplayName } from "@/features/admin/users/actions";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";

export function EditUserNameForm({
  userId,
  currentName,
}: {
  userId: string;
  currentName: string | null;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; ok?: boolean } | null, formData: FormData) => {
      const result = await updateUserDisplayName(formData);
      return result ?? null;
    },
    null,
  );

  return (
    <form action={action} className="mt-2 flex gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="displayName"
        type="text"
        defaultValue={currentName ?? ""}
        placeholder="Display name"
        required
        className={`${inputClass} flex-1`}
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 disabled:opacity-50"
      >
        {pending ? "…" : "Save"}
      </button>
      {state?.error && (
        <p className="absolute text-sm text-red-400">{state.error}</p>
      )}
    </form>
  );
}
