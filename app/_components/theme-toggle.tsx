export function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      data-theme-toggle="true"
      className="relative z-[1001] pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full border border-slate-700 bg-slate-900/85 px-3 text-sm font-medium text-slate-200 shadow-lg shadow-blue-950/30 transition hover:border-cyan-400/70"
    >
      <span data-theme-icon="true">🌙</span>
      <span data-theme-label="true">Dark</span>
    </button>
  );
}
