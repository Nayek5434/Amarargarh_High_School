"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/admissions", label: "Admissions" },
  { href: "/academics", label: "Academics" },
  { href: "/teachers", label: "Teachers" },
  { href: "/magazine", label: "Magazine" },
  { href: "/achievements", label: "Achievements" },
  { href: "/events", label: "Events" },
  { href: "/notices", label: "Notices" },
  { href: "/contact", label: "Contact" },
];

export function NavLinks() {
  const pathname = usePathname();

  const shouldStartLoading = (href: string) => {
    if (href === "/") {
      return pathname !== "/";
    }

    return pathname !== href;
  };

  const startRouteLoading = (href: string) => {
    if (!shouldStartLoading(href)) {
      return;
    }

    window.dispatchEvent(new Event("amarargarh:route-loading-start"));
  };

  const linkClass = (isActive: boolean) =>
    isActive
      ? "rounded-md bg-gradient-to-r from-blue-600 to-fuchsia-600 px-3 py-2 text-white shadow-lg shadow-blue-900/30 transition"
      : "rounded-md px-3 py-2 text-slate-300 transition hover:bg-slate-800/80 hover:text-slate-100";

  return (
    <div className="relative">
      <nav className="hidden flex-wrap items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/50 p-1.5 text-sm font-medium md:flex">
        {links.map((link) => {
          const isActive =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              onClick={() => startRouteLoading(link.href)}
              className={linkClass(isActive)}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <details className="relative z-[900] md:hidden">
        <summary
          aria-label="Open menu"
          className="mobile-menu-trigger inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-200 shadow-lg shadow-blue-950/30 [&::-webkit-details-marker]:hidden"
        >
          <span className="flex flex-col gap-1">
            <span className="mobile-menu-dot h-1 w-1 rounded-full bg-slate-200" />
            <span className="mobile-menu-dot h-1 w-1 rounded-full bg-slate-200" />
            <span className="mobile-menu-dot h-1 w-1 rounded-full bg-slate-200" />
          </span>
        </summary>
        <nav className="fixed inset-x-3 top-[72px] z-[960] max-h-[calc(100dvh-88px)] overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-950/95 p-3 shadow-2xl shadow-blue-950/50 backdrop-blur">
          <div className="grid gap-1 text-sm font-medium">
            {links.map((link) => {
              const isActive =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => startRouteLoading(link.href)}
                  className={linkClass(isActive)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </details>
    </div>
  );
}
