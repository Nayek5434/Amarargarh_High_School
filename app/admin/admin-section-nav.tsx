const sections = [
  { id: "site-settings", label: "Site" },
  { id: "admin-security", label: "Security" },
  { id: "page-content", label: "Pages" },
  { id: "important-boxes", label: "Dynamic Blocks" },
  { id: "events", label: "Events" },
  { id: "notices", label: "Notices" },
  { id: "teachers", label: "Teachers" },
  { id: "achievements", label: "Achievements" },
  { id: "magazine", label: "Magazine" },
];

export function AdminSectionNav() {
  const desktopLinkClass =
    "admin-nav-btn rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800";
  const mobileLinkClass =
    "admin-nav-btn rounded-md px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-slate-800";

  return (
    <div className="admin-nav-wrap rounded-xl border border-slate-700/70 bg-slate-900/60 p-3">
      <div className="hidden flex-wrap gap-2 md:flex">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={desktopLinkClass}
          >
            {section.label}
          </a>
        ))}
      </div>

      <div className="md:hidden">
        <details>
          <summary className="admin-nav-toggle inline-flex w-full cursor-pointer list-none items-center justify-between rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 [&::-webkit-details-marker]:hidden">
            Sections
            <span>⋮</span>
          </summary>
          <div className="admin-nav-mobile-panel mt-2 grid gap-1 rounded-md border border-slate-700/80 bg-slate-950/95 p-2">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className={mobileLinkClass}>
                {section.label}
              </a>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
