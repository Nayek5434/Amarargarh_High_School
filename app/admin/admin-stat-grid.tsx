type StatItem = {
  label: string;
  value: number | string;
};

type AdminStatGridProps = {
  items: StatItem[];
  lastUpdated?: Date;
};

export function AdminStatGrid({ items, lastUpdated }: AdminStatGridProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
      {items.map((item) => (
        <div key={item.label} className="admin-stat-card rounded-xl border border-slate-700/80 bg-slate-900/70 p-4">
          <p className="text-xs font-medium uppercase text-slate-400">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-100">{item.value}</p>
        </div>
      ))}
      <div className="admin-stat-card rounded-xl border border-slate-700/80 bg-slate-900/70 p-4">
        <p className="text-xs font-medium uppercase text-slate-400">Last Updated</p>
        <p className="mt-1 text-sm font-semibold text-slate-100">{lastUpdated?.toDateString() ?? "N/A"}</p>
      </div>
    </section>
  );
}
