"use client";

import { useActionState } from "react";
import { submitRegistration } from "@/features/registration/actions";
import { CURRENT_REGISTRATION_LABEL } from "@/lib/registration";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100";

type ChildOption = {
  id: string;
  firstName: string;
  lastName: string;
  level: string;
  registered: boolean;
};

export function RegistrationForm({ childOptions }: { childOptions: ChildOption[] }) {
  const eligible = childOptions.filter((child) => !child.registered);

  const [state, action, pending] = useActionState(
    async (
      _prev: { error?: string; ok?: boolean; message?: string } | null,
      formData: FormData,
    ) => {
      const result = await submitRegistration(formData);
      return result ?? null;
    },
    null,
  );

  if (eligible.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
        All your children already have a Summer 2026 registration on file, or
        add a child under Kids first.
      </p>
    );
  }

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <h2 className="font-semibold">{CURRENT_REGISTRATION_LABEL} registration</h2>
      <p className="text-xs text-zinc-500">
        Pay by e-transfer, then submit your reference number. Optional: attach
        a screenshot of your transfer.
      </p>

      <select name="playerId" required className={inputClass} defaultValue="">
        <option value="" disabled>
          Select child
        </option>
        {eligible.map((child) => (
          <option key={child.id} value={child.id}>
            {child.firstName} {child.lastName} ({child.level})
          </option>
        ))}
      </select>

      <input
        name="eTransferReference"
        type="text"
        placeholder="E-transfer reference / confirmation number"
        required
        className={inputClass}
      />

      <label className="block text-sm text-zinc-400">
        <span className="mb-1 block">Payment proof (optional)</span>
        <input
          name="proof"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="w-full text-xs"
        />
      </label>

      <textarea
        name="parentNotes"
        placeholder="Notes for CST (optional)"
        rows={2}
        className={inputClass}
      />

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.message && (
        <p className="text-sm text-[#8BC34A]">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#8BC34A] py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Submit registration"}
      </button>
    </form>
  );
}
