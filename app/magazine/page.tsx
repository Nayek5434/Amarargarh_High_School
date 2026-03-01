import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ensureDefaults } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Magazine",
  description: "Read school magazine content from Amarargarh High School including quotes, poems, and stories.",
  alternates: { canonical: "/magazine" },
};

const categories = ["all", "quote", "poem", "story"] as const;

type MagazineItem = {
  id: number;
  title: string;
  category: string;
  content: string;
  author: string | null;
  publishedAt: Date;
};

type MagazineDelegate = {
  findMany: (args: { where?: Prisma.MagazinePostWhereInput; orderBy: { publishedAt: "desc" } }) => Promise<MagazineItem[]>;
};

function label(category: string) {
  if (category === "quote") return "Quote";
  if (category === "poem") return "Poem";
  if (category === "story") return "Story";
  return "All";
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

export default async function MagazinePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await ensureDefaults();

  const params = await searchParams;
  const currentCategory = categories.includes((params.category ?? "all") as (typeof categories)[number])
    ? (params.category ?? "all")
    : "all";

  const magazineDelegate = (prisma as unknown as { magazinePost: MagazineDelegate }).magazinePost;
  const where: Prisma.MagazinePostWhereInput =
    currentCategory === "all"
      ? {}
      : { category: currentCategory };

  const [posts, importantBoxes] = await Promise.all([
    magazineDelegate.findMany({ where, orderBy: { publishedAt: "desc" } }),
    prisma.importantBox.findMany({ where: { pageSlug: "magazine", isActive: true }, orderBy: { createdAt: "desc" }, take: 2 }),
  ]);
  const filtered = posts;
  const latestVisiblePost = filtered[0] ?? null;

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
        <div className="pointer-events-none absolute -left-16 -top-14 h-44 w-44 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-52 w-52 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="section-kicker">Creative Corner</p>
          <Link href="/achievements" className="more-info-chip">View achievements</Link>
        </div>
        <h2 className="section-title">School Magazine</h2>
        <div className="section-divider" />
        <p className="mt-2 text-sm text-slate-300">
          Explore quotes, poems, and short stories from our school editorial and literary clubs.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Last updated: {latestVisiblePost ? formatDateTime(latestVisiblePost.publishedAt) : "No updates yet"}
        </p>

        <form className="mt-4 flex flex-wrap gap-3">
          <select name="category" defaultValue={currentCategory} className="input-base w-[180px]">
            <option value="all">All</option>
            <option value="quote">Quotes</option>
            <option value="poem">Poems</option>
            <option value="story">Stories</option>
          </select>
          <button className="btn-primary">Apply</button>
        </form>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((post) => (
          <article key={post.id} className="card">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{label(post.category)}</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-100">{post.title}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{post.content}</p>
            <p className="mt-4 text-xs text-slate-400">{post.author ? `By ${post.author}` : "School Magazine Team"}</p>
          </article>
        ))}
        {filtered.length === 0 && (
          <article className="card md:col-span-2 xl:col-span-3">
            <p className="text-lg">🖋️</p>
            <p className="mt-2 text-sm font-semibold text-slate-200">No magazine posts in this category yet</p>
            <p className="mt-1 text-sm text-slate-400">Try selecting All, or check back soon for new creative submissions.</p>
          </article>
        )}
      </div>
    </section>
  );
}
