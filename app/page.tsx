import type { Metadata } from "next";
import Link from "next/link";
import { DynamicBlocks } from "@/app/_components/dynamic-blocks";
import { ensureDefaults } from "@/lib/content";
import { normalizeDynamicBlock, sortDynamicBlocksForPage } from "@/lib/dynamic-blocks";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Home",
  description: "Welcome to Amarargarh High School. View latest notices, upcoming events, achievements, and key school updates.",
  alternates: { canonical: "/" },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function HomePage() {
  await ensureDefaults();

  const [settings, notices, events, achievements, magazinePosts, importantBoxes] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
    prisma.notice.findMany({ orderBy: { publishedAt: "desc" }, take: 3 }),
    prisma.event.findMany({ orderBy: { eventDate: "asc" }, take: 3 }),
    prisma.studentAchievement.findMany({
      orderBy: [{ passedOutYear: "desc" }, { studentName: "asc" }],
      take: 2,
    }),
    prisma.magazinePost.findMany({ orderBy: { publishedAt: "desc" }, take: 2 }),
    prisma.importantBox.findMany({
      where: { pageSlug: "home", isActive: true },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  const normalizedImportantBoxes = sortDynamicBlocksForPage(importantBoxes.map(normalizeDynamicBlock));

  const upcomingCount = events.filter((event) => event.eventDate >= new Date()).length;
  const latestNotice = notices[0];
  const nextEvent = events[0];

  return (
    <div className="space-y-7">
      <DynamicBlocks blocks={normalizedImportantBoxes} label="Dynamic Update" />

      <section className="card relative overflow-hidden">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="grid gap-6 md:grid-cols-[1.7fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Official Website</p>
            <h2 className="hero-school-title hero-school-title-main mt-2">
              Amarargarh High School
            </h2>
            <p className="mt-3 max-w-2xl text-slate-300">
              {settings?.tagline}. A modern learning community focused on academic depth, values, and student growth.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/about" className="btn-primary">
                More About School
              </Link>
              <Link href="/admissions" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800">
                Admission Info
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <p>Address: {settings?.address ?? "Amarargarh, India"}</p>
              <p>Office: Monday - Saturday, 10:00 AM - 3:00 PM</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
            <div className="hero-stat-card rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-slate-900/80 p-4">
              <p className="hero-stat-label text-xs font-medium uppercase text-slate-400">Notices</p>
              <p className="hero-stat-value mt-1 text-2xl font-bold text-slate-100">{notices.length}</p>
            </div>
            <div className="hero-stat-card rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-slate-900/80 to-slate-900/80 p-4">
              <p className="hero-stat-label text-xs font-medium uppercase text-slate-400">Upcoming Events</p>
              <p className="hero-stat-value mt-1 text-2xl font-bold text-slate-100">{upcomingCount}</p>
            </div>
            <div className="hero-stat-card rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-900/80 to-slate-900/80 p-4">
              <p className="hero-stat-label text-xs font-medium uppercase text-slate-400">Helpdesk</p>
              <p className="hero-stat-value mt-1 text-sm font-semibold text-slate-100">{settings?.phone}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card bg-gradient-to-br from-cyan-500/8 via-slate-900/70 to-slate-900/70">
          <div className="flex items-center gap-2">
            <span className="icon-pill">🎓</span>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Academic Excellence</p>
          </div>
          <h3 className="mt-1 text-lg font-semibold">Clear Learning Path</h3>
          <p className="mt-2 text-sm text-slate-300">Structured curriculum, assessments, and mentoring for Classes 5–10.</p>
          <Link href="/academics" className="more-info-chip mt-4">View details →</Link>
        </article>
        <article className="card bg-gradient-to-br from-amber-500/8 via-slate-900/70 to-slate-900/70">
          <div className="flex items-center gap-2">
            <span className="icon-pill">🏆</span>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Student Success</p>
          </div>
          <h3 className="mt-1 text-lg font-semibold">Board Exam Highlights</h3>
          <p className="mt-2 text-sm text-slate-300">{achievements[0]?.studentName ? `${achievements[0].studentName} - ${achievements[0].rank}` : "Latest rank and memory updates from our alumni."}</p>
          <Link href="/achievements" className="more-info-chip mt-4">View details →</Link>
        </article>
        <article className="card bg-gradient-to-br from-fuchsia-500/8 via-slate-900/70 to-slate-900/70">
          <div className="flex items-center gap-2">
            <span className="icon-pill">✨</span>
            <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-300">Campus Life</p>
          </div>
          <h3 className="mt-1 text-lg font-semibold">Events & Activities</h3>
          <p className="mt-2 text-sm text-slate-300">{nextEvent ? `${nextEvent.title} · ${formatDate(nextEvent.eventDate)}` : "Upcoming school events and co-curricular updates."}</p>
          <Link href="/events" className="more-info-chip mt-4">View details →</Link>
        </article>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="card rounded-lg border border-slate-700/80 bg-slate-900/75 p-4">
          <p className="text-xs uppercase text-slate-400">Academic Range</p>
          <p className="mt-1 text-base font-semibold text-slate-100">Classes V to X</p>
        </article>
        <article className="card rounded-lg border border-slate-700/80 bg-slate-900/75 p-4">
          <p className="text-xs uppercase text-slate-400">Admission Support</p>
          <p className="mt-1 text-base font-semibold text-slate-100">Document guidance at school office</p>
        </article>
        <article className="card rounded-lg border border-slate-700/80 bg-slate-900/75 p-4">
          <p className="text-xs uppercase text-slate-400">Office Hours</p>
          <p className="mt-1 text-base font-semibold text-slate-100">10:00 AM - 3:00 PM</p>
        </article>
        <article className="card rounded-lg border border-slate-700/80 bg-slate-900/75 p-4">
          <p className="text-xs uppercase text-slate-400">Contact</p>
          <p className="mt-1 text-base font-semibold text-slate-100">{settings?.phone}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <article className="card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Latest Notice Snapshot</h3>
            <Link href="/notices" className="more-info-chip">View notices</Link>
          </div>
          {latestNotice ? (
            <>
              <p className="font-medium text-slate-100">{latestNotice.title}</p>
              <p className="mt-1 line-clamp-3 text-sm text-slate-300">{latestNotice.content}</p>
              <p className="mt-2 text-xs text-slate-400">{formatDate(latestNotice.publishedAt)}</p>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">No notices published yet.</p>
              <p className="text-xs text-slate-500">For urgent updates, please contact the school office.</p>
              <Link href="/contact" className="more-info-chip">Contact office</Link>
            </div>
          )}
        </article>

        <article className="card">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Magazine Spotlight</h3>
            <Link href="/magazine" className="more-info-chip">View magazine</Link>
          </div>
          {magazinePosts.length > 0 ? (
            <div className="space-y-3">
              {magazinePosts.map((post) => (
                <div key={post.id} className="magazine-item rounded-lg border border-fuchsia-500/25 bg-gradient-to-r from-fuchsia-500/10 via-slate-900/70 to-slate-900/70 p-3">
                  <p className="magazine-category text-xs uppercase text-fuchsia-300">{post.category}</p>
                  <p className="font-medium text-slate-100">{post.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">No magazine posts yet.</p>
              <p className="text-xs text-slate-500">New literary content will be published soon.</p>
              <Link href="/contact" className="more-info-chip">Contact office</Link>
            </div>
          )}
        </article>
      </section>

      <section className="card">
        <h3 className="text-lg font-semibold">Quick Access</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { href: "/about", label: "About" },
            { href: "/admissions", label: "Admissions" },
            { href: "/teachers", label: "Teachers" },
            { href: "/notices", label: "Notices" },
            { href: "/contact", label: "Contact" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="quick-access-link rounded-lg border border-slate-700/80 bg-gradient-to-br from-blue-500/8 via-slate-900/80 to-slate-900/80 px-3 py-2 text-center text-sm font-medium text-slate-100 transition hover:border-cyan-400/60"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
