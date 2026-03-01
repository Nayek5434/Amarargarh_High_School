import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ensureDefaults } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Achievements",
  description: "Discover student achievements, board exam ranks, and memory stories from Amarargarh High School alumni.",
  alternates: { canonical: "/achievements" },
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AchievementsPage() {
  await ensureDefaults();

  const [achievements, importantBoxes, latestAchievement] = await Promise.all([
    prisma.studentAchievement.findMany({
      orderBy: [{ passedOutYear: "desc" }, { studentName: "asc" }],
    }),
    prisma.importantBox.findMany({ where: { pageSlug: "achievements", isActive: true }, orderBy: { createdAt: "desc" } }),
    prisma.studentAchievement.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);

  return (
    <section className="space-y-6">
      {importantBoxes.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2">
          {importantBoxes.slice(0, 2).map((box) => (
            <article key={box.id} className="card border-cyan-500/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Important Update</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-100">{box.title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-300">{box.content}</p>
            </article>
          ))}
        </section>
      )}

      <header className="card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="section-kicker">Merit & Memories</p>
          <Link href="/magazine" className="more-info-chip">View magazine</Link>
        </div>
        <h2 className="section-title">Student Achievements & Memory Wall</h2>
        <div className="section-divider" />
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Celebrating our passed-out students who earned remarkable ranks in Madhyamik and made Amarargarh proud.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Last updated: {latestAchievement ? formatDateTime(latestAchievement.createdAt) : "No updates yet"}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((item) => (
          <article key={item.id} className="card overflow-hidden">
            <div className="-m-6 mb-4 h-48 overflow-hidden border-b border-slate-700/80 bg-slate-800/70">
              <Image
                src={item.photoUrl ?? "/images/students/student1.svg"}
                alt={item.studentName}
                width={600}
                height={420}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">{item.exam}</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-100">{item.studentName}</h3>
            <p className="text-sm text-blue-300">{item.rank}</p>
            <p className="mt-2 text-sm text-slate-300">Passed Out: {item.passedOutYear}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{item.story}</p>
          </article>
        ))}
        {achievements.length === 0 && (
          <article className="card md:col-span-2 lg:col-span-3">
            <p className="text-lg">🏆</p>
            <p className="mt-2 text-sm font-semibold text-slate-200">Achievements will be published soon</p>
            <p className="mt-1 text-sm text-slate-400">Student results and memory highlights will appear here after updates.</p>
          </article>
        )}
      </div>
    </section>
  );
}
