import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ensureDefaults } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Teachers",
  description: "Meet the faculty team of Amarargarh High School, including departments, profiles, and teaching experience.",
  alternates: { canonical: "/teachers" },
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

export default async function TeachersPage() {
  await ensureDefaults();

  const [teachers, importantBoxes, latestTeacherRecord] = await Promise.all([
    prisma.teacher.findMany({
      orderBy: [{ department: "asc" }, { name: "asc" }],
    }),
    prisma.importantBox.findMany({
      where: { pageSlug: "teachers", isActive: true },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    prisma.teacher.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
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

      <div className="card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="section-kicker">Faculty Profiles</p>
          <Link href="/about" className="more-info-chip">View about school</Link>
        </div>
        <h2 className="section-title">Teachers&apos; Corner</h2>
        <div className="section-divider" />
        <p className="mt-2 text-sm text-slate-300">
          Meet our faculty team committed to student success, mentorship, and subject excellence.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Last updated: {latestTeacherRecord ? formatDateTime(latestTeacherRecord.createdAt) : "No updates yet"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teachers.map((teacher) => (
          <article key={teacher.id} className="card overflow-hidden">
            <div className="-m-6 mb-4 h-48 overflow-hidden border-b border-slate-700/80 bg-slate-800/70">
              <Image
                src={teacher.photoUrl ?? "/images/teachers/teacher1.svg"}
                alt={teacher.name}
                width={600}
                height={420}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">{teacher.department}</p>
            <h3 className="mt-1 text-xl font-semibold text-slate-100">{teacher.name}</h3>
            <p className="text-sm font-medium text-slate-300">{teacher.designation}</p>

            <p className="mt-3 text-sm leading-6 text-slate-300">{teacher.bio}</p>

            <div className="mt-4 space-y-1 text-sm text-slate-300">
              {teacher.experienceYears !== null && <p>Experience: {teacher.experienceYears}+ years</p>}
              {teacher.email && <p>Email: {teacher.email}</p>}
              {teacher.achievements && <p>Achievement: {teacher.achievements}</p>}
            </div>
          </article>
        ))}
        {teachers.length === 0 && (
          <article className="card md:col-span-2 xl:col-span-3">
            <p className="text-lg">👩‍🏫</p>
            <p className="mt-2 text-sm font-semibold text-slate-200">Teachers profile will appear here soon</p>
            <p className="mt-1 text-sm text-slate-400">Our faculty details are being updated. Please check back shortly.</p>
          </article>
        )}
      </div>
    </section>
  );
}
