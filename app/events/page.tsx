import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Events",
  description: "Explore upcoming and past events, celebrations, and academic activities at Amarargarh High School.",
  alternates: { canonical: "/events" },
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

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const params = await searchParams;
  const searchText = (params.q ?? "").trim();
  const view = params.view === "past" || params.view === "all" ? params.view : "upcoming";
  const today = new Date();

  const where: Prisma.EventWhereInput = {
    ...(searchText.length > 0
      ? {
          OR: [
            { title: { contains: searchText } },
            { description: { contains: searchText } },
          ],
        }
      : {}),
    ...(view === "past" ? { eventDate: { lt: today } } : {}),
    ...(view === "upcoming" ? { eventDate: { gte: today } } : {}),
  };

  const [events, importantBoxes, totalEvents, upcomingCount, latestEventRecord] = await Promise.all([
    prisma.event.findMany({ where, orderBy: { eventDate: "asc" } }),
    prisma.importantBox.findMany({ where: { pageSlug: "events", isActive: true }, orderBy: { createdAt: "desc" }, take: 2 }),
    prisma.event.count(),
    prisma.event.count({ where: { eventDate: { gte: today } } }),
    prisma.event.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
  ]);

  const filtered = events;

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
          <p className="section-kicker">Event Updates</p>
          <Link href="/notices" className="more-info-chip">View notices</Link>
        </div>
        <h2 className="section-title">Events Calendar</h2>
        <div className="section-divider" />
        <p className="mt-2 text-sm text-slate-300">Browse upcoming programs, celebrations, and school activities.</p>
        <p className="mt-1 text-xs text-slate-400">
          Last updated: {latestEventRecord ? formatDateTime(latestEventRecord.createdAt) : "No updates yet"}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-3">
            <p className="text-xs uppercase text-slate-400">Total Events</p>
            <p className="text-xl font-bold text-slate-100">{totalEvents}</p>
          </div>
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-3">
            <p className="text-xs uppercase text-slate-400">Upcoming</p>
            <p className="text-xl font-bold text-slate-100">{upcomingCount}</p>
          </div>
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-3">
            <p className="text-xs uppercase text-slate-400">Showing</p>
            <p className="text-xl font-bold text-slate-100">{filtered.length}</p>
          </div>
        </div>

        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input
            type="text"
            name="q"
            defaultValue={searchText}
            className="input-base"
            placeholder="Search by event title or description"
          />
          <select name="view" defaultValue={view} className="input-base">
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="all">All Events</option>
          </select>
          <button className="btn-primary">Apply</button>
        </form>
      </div>

      <div className="card">
        <ul className="space-y-3">
          {filtered.map((event) => (
            <li key={event.id} className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-base font-semibold text-slate-100">{event.title}</p>
                <p className="text-xs font-medium text-slate-400">{formatDate(event.eventDate)}</p>
              </div>
              <p className="mt-2 text-sm text-slate-300">{event.description}</p>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="rounded-lg border border-slate-700/80 bg-slate-900/80 p-5 text-center">
              <p className="text-lg">📅</p>
              <p className="mt-1 text-sm font-semibold text-slate-200">No events match your filters</p>
              <p className="mt-1 text-sm text-slate-400">Try clearing search text or switching the view to All Events.</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <Link href="/events?view=all" className="more-info-chip">Show all events</Link>
                <Link href="/contact" className="more-info-chip">Contact office</Link>
              </div>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
