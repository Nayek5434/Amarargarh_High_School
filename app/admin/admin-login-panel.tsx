import { AdminLoginForm } from "@/app/admin/admin-login-form";

type AdminLoginPanelProps = {
  setupComplete: boolean;
  canUseRecovery: boolean;
  failedAttempts: number;
};

export function AdminLoginPanel({ setupComplete, canUseRecovery, failedAttempts }: AdminLoginPanelProps) {
  return (
    <section className="mx-auto max-w-md rounded-2xl border border-slate-700/70 bg-slate-900/80 p-6 shadow-xl shadow-blue-900/30 backdrop-blur">
      <h2 className="text-2xl font-semibold text-slate-100">Admin Panel Login</h2>
      <p className="mt-2 text-sm text-slate-300">
        {setupComplete
          ? "Enter your admin ID and password to access the dashboard."
          : "Create your first Admin ID and password to activate server-managed admin access."}
      </p>
      <AdminLoginForm
        setupComplete={setupComplete}
        canUseRecovery={canUseRecovery}
        failedAttempts={failedAttempts}
      />
    </section>
  );
}
