import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Notices",
  description: "Read the latest official school notices, circulars, and class-wise announcements from Amarargarh High School.",
  alternates: { canonical: "/notices" },
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; range?: string; cls?: string }>;
}) {
  const params = await searchParams;
  const searchText = (params.q ?? "").trim().toLowerCase();
  const range = params.range === "all" ? "all" : "30";
  const selectedClass = ["ALL", "5", "6", "7", "8", "9", "10"].includes((params.cls ?? "").toUpperCase())
    ? (params.cls ?? "ALL").toUpperCase()
    : "ALL";
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  const whereClauses: Prisma.NoticeWhereInput[] = [];

  if (searchText.length > 0) {
    whereClauses.push({
      OR: [
        { title: { contains: searchText } },
        { content: { contains: searchText } },
      ],
    });
  }

  if (range !== "all") {
    whereClauses.push({ publishedAt: { gte: last30Days } });
  }

  if (selectedClass !== "ALL") {
    whereClauses.push({
      OR: [
        { targetClass: "ALL" },
        { targetClass: selectedClass },
      ],
    });
  }

  const where: Prisma.NoticeWhereInput = whereClauses.length > 0 ? { AND: whereClauses } : {};

  const [filtered, importantBoxes, totalNotices, recentCount, latestNotice] = await Promise.all([
    prisma.notice.findMany({ where, orderBy: { publishedAt: "desc" } }),
    prisma.importantBox.findMany({ where: { pageSlug: "notices", isActive: true }, orderBy: { createdAt: "desc" }, take: 2 }),
    prisma.notice.count(),
    prisma.notice.count({ where: { publishedAt: { gte: last30Days } } }),
    prisma.notice.findFirst({ orderBy: { publishedAt: "desc" }, select: { publishedAt: true } }),
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

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="section-kicker">Official Circulars</p>
          <Link href="/events" className="more-info-chip">View events</Link>
        </div>
        <h2 className="section-title">Notice Board</h2>
        <div className="section-divider" />
        <p className="mt-2 text-sm text-slate-300">Track circulars, updates, holidays, and official announcements.</p>
        <p className="mt-1 text-xs text-slate-400">
          Last updated: {latestNotice ? formatDateTime(latestNotice.publishedAt) : "No updates yet"}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-3">
            <p className="text-xs uppercase text-slate-400">Total Notices</p>
            <p className="text-xl font-bold text-slate-100">{totalNotices}</p>
          </div>
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-3">
            <p className="text-xs uppercase text-slate-400">Last 30 Days</p>
            <p className="text-xl font-bold text-slate-100">{recentCount}</p>
          </div>
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-3">
            <p className="text-xs uppercase text-slate-400">Showing</p>
            <p className="text-xl font-bold text-slate-100">{filtered.length}</p>
          </div>
        </div>

        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_180px_auto]">
          <input
            type="text"
            name="q"
            defaultValue={params.q ?? ""}
            className="input-base"
            placeholder="Search by notice title or content"
          />
          <select name="range" defaultValue={range} className="input-base">
            <option value="30">Last 30 days</option>
            <option value="all">All notices</option>
          </select>
          <select name="cls" defaultValue={selectedClass} className="input-base">
            <option value="ALL">All Classes</option>
            <option value="5">Class 5</option>
            <option value="6">Class 6</option>
            <option value="7">Class 7</option>
            <option value="8">Class 8</option>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
          </select>
          <button className="btn-primary">Apply</button>
        </form>
      </div>

      <div className="card">
        <ul className="space-y-3">
          {filtered.map((notice) => (
            <li key={notice.id} className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-base font-semibold text-slate-100">{notice.title}</p>
                <p className="text-xs font-medium text-slate-400">{formatDate(notice.publishedAt)}</p>
              </div>
              <p className="mt-1 text-xs font-medium text-cyan-300">
                {notice.targetClass === "ALL" ? "For all classes" : `For class ${notice.targetClass}`}
              </p>
              <p className="mt-2 text-sm text-slate-300">{notice.content}</p>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-5 text-center">
              <p className="text-lg">📌</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">No notices match your filters</p>
              <p className="mt-1 text-sm text-slate-400">Try selecting All Classes or changing your date range.</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Link href="/notices?range=all&cls=ALL" className="more-info-chip">Reset filters</Link>
                <Link href="/contact" className="more-info-chip">Contact office</Link>
              </div>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
