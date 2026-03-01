"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticateAdmin, createAdminAccount, recoverAdminAccess, type AuthState } from "@/app/admin/actions";

const initialState: AuthState = { error: null };

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="btn-primary w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

type AdminLoginFormProps = {
  setupComplete: boolean;
  canUseRecovery: boolean;
  failedAttempts: number;
};

export function AdminLoginForm({ setupComplete, canUseRecovery, failedAttempts }: AdminLoginFormProps) {
  const [setupState, setupAction] = useActionState(createAdminAccount, initialState);
  const [loginState, loginAction] = useActionState(authenticateAdmin, initialState);
  const [recoveryState, recoveryAction] = useActionState(recoverAdminAccess, initialState);

  if (!setupComplete) {
    return (
      <div className="mt-6 space-y-5">
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-sm text-cyan-200">
          First-time setup: create your Admin ID and password. This credential will be saved on the server.
        </div>
        <p className="text-xs text-slate-400">Password must include uppercase, lowercase, number, and special character.</p>

        <form action={setupAction} className="space-y-3">
          <input name="loginId" className="input-base" placeholder="Create Admin ID" autoComplete="username" />
          <input name="password" type="password" className="input-base" placeholder="Create password" autoComplete="new-password" />
          <input
            name="confirmPassword"
            type="password"
            className="input-base"
            placeholder="Confirm password"
            autoComplete="new-password"
          />
          {setupState.error && <p className="text-sm text-rose-400">{setupState.error}</p>}
          <SubmitButton label="Create Admin Account" pendingLabel="Creating..." />
        </form>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      <form action={loginAction} className="space-y-3">
        <input name="loginId" className="input-base" placeholder="Admin ID" autoComplete="username" />
        <input name="password" type="password" className="input-base" placeholder="Password" autoComplete="current-password" />
        <p className="text-xs text-slate-400">
          Security note: recovery unlocks after 5 failed attempts using your server-configured Secret Pass.
        </p>
        {failedAttempts > 0 && (
          <p className="text-xs text-slate-400">Failed attempts: {failedAttempts}/5</p>
        )}
        {loginState.error && <p className="text-sm text-rose-400">{loginState.error}</p>}
        <SubmitButton label="Unlock Admin Panel" pendingLabel="Checking..." />
      </form>

      {(canUseRecovery || loginState.canUseRecovery) && (
        <form action={recoveryAction} className="space-y-3 rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Recovery After 5 Failed Attempts</p>
          <p className="text-xs text-slate-400">Use the server-configured Secret Pass to reset Admin ID and password.</p>
          <input
            name="secretPass"
            type="password"
            className="input-base"
            placeholder="Secret pass"
            autoComplete="one-time-code"
          />
          <input name="newLoginId" className="input-base" placeholder="New Admin ID" autoComplete="username" />
          <input
            name="newPassword"
            type="password"
            className="input-base"
            placeholder="New password"
            autoComplete="new-password"
          />
          <p className="text-xs text-slate-400">New password must include uppercase, lowercase, number, and special character.</p>
          {recoveryState.error && <p className="text-sm text-rose-400">{recoveryState.error}</p>}
          <SubmitButton label="Reset Credentials" pendingLabel="Resetting..." />
        </form>
      )}
    </div>
  );
}
