"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changeAdminCredentials, type CredentialState } from "@/app/admin/actions";

const initialState: CredentialState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="btn-primary w-fit" disabled={pending}>
      {pending ? "Updating..." : "Update Admin Credentials"}
    </button>
  );
}

export function AdminCredentialsForm() {
  const [state, action] = useActionState(changeAdminCredentials, initialState);

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <input
        name="currentPassword"
        type="password"
        className="input-base md:col-span-2"
        placeholder="Current password"
        autoComplete="current-password"
      />
      <input name="newLoginId" className="input-base" placeholder="New Admin ID" autoComplete="username" />
      <input name="newPassword" type="password" className="input-base" placeholder="New password" autoComplete="new-password" />
      <input
        name="confirmPassword"
        type="password"
        className="input-base md:col-span-2"
        placeholder="Confirm new password"
        autoComplete="new-password"
      />
      <p className="text-xs text-slate-400 md:col-span-2">Password must include uppercase, lowercase, number, and special character.</p>
      {state.error && <p className="text-sm text-rose-400 md:col-span-2">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-400 md:col-span-2">{state.success}</p>}
      <div className="md:col-span-2">
        <SubmitButton />
      </div>
    </form>
  );
}
