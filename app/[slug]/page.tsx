import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DynamicBlocks } from "@/app/_components/dynamic-blocks";
import { ensureDefaults } from "@/lib/content";
import { normalizeDynamicBlock, sortDynamicBlocksForPage } from "@/lib/dynamic-blocks";
import { prisma } from "@/lib/prisma";

const allowedSlugs = new Set(["about", "admissions", "academics", "contact"]);

export const revalidate = 300;

export function generateStaticParams() {
  return [{ slug: "about" }, { slug: "admissions" }, { slug: "academics" }, { slug: "contact" }];
}

const seoBySlug: Record<string, { title: string; description: string }> = {
  about: {
    title: "About",
    description: "Learn about Amarargarh High School, our values, mission, and commitment to holistic student development.",
  },
  admissions: {
    title: "Admissions",
    description: "Admission guidance, eligibility details, and enrollment process for Amarargarh High School.",
  },
  academics: {
    title: "Academics",
    description: "Explore the academic approach, curriculum focus, and learning framework at Amarargarh High School.",
  },
  contact: {
    title: "Contact",
    description: "Contact Amarargarh High School for office support, admissions help, and official communication details.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (!allowedSlugs.has(slug)) {
    return {};
  }

  const seo = seoBySlug[slug] ?? {
    title: "School Information",
    description: "Official information page of Amarargarh High School.",
  };

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `/${slug}`,
    },
  };
}

export default async function ContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!allowedSlugs.has(slug)) {
    notFound();
  }

  await ensureDefaults();
  const [page, importantBoxes] = await Promise.all([
    prisma.page.findUnique({ where: { slug } }),
    prisma.importantBox.findMany({
      where: { pageSlug: slug, isActive: true },
      orderBy: [{ createdAt: "desc" }],
    }),
  ]);

  const normalizedImportantBoxes = sortDynamicBlocksForPage(importantBoxes.map(normalizeDynamicBlock));

  if (!page) {
    notFound();
  }

  const slugLabel = slug.charAt(0).toUpperCase() + slug.slice(1);
  const highlights: Record<string, string[]> = {
    about: [
      "Value-based learning culture",
      "Student-centric discipline framework",
      "Parent-school collaboration model",
    ],
    admissions: [
      "Transparent admission support process",
      "Guidance for required document submission",
      "Session-oriented enrollment timeline",
    ],
    academics: [
      "Balanced theory + practical learning",
      "Continuous assessment and remedial tracking",
      "Co-curricular integration for holistic growth",
    ],
    contact: [
      "Dedicated support for parents and students",
      "Administrative help desk for document services",
      "Fast communication through office channels",
    ],
  };

  return (
    <div className="space-y-6">
      <DynamicBlocks blocks={normalizedImportantBoxes} label="Dynamic Note" />

      <div className="grid gap-6 lg:grid-cols-[1.9fr_1fr]">
        <article className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="section-kicker">{slugLabel} Details</p>
          <Link href="/contact" className="more-info-chip">More info</Link>
        </div>
        <p className="content-page-label text-sm font-medium uppercase tracking-wide text-blue-400">{slugLabel}</p>
        <div className="section-divider" />
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">{page.title}</h2>
        <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-300">{page.content}</p>
        </article>

        <aside className="card h-fit">
        <h3 className="text-lg font-semibold text-slate-100">Need More Help?</h3>
        <p className="mt-2 text-sm text-slate-300">
          For admissions, fee details, document verification, or transfer certificates, contact the school office.
        </p>
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          <p>Visit the contact page for official communication details.</p>
          <p>Office timings and response channels are updated regularly.</p>
        </div>

        <div className="mt-5 rounded-xl border border-slate-700/80 bg-slate-900/80 p-4">
          <p className="content-page-label text-xs font-semibold uppercase tracking-wide text-blue-400">Key Highlights</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-300">
            {(highlights[slug] ?? []).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        {slug === "admissions" ? (
          <div className="mt-5 rounded-xl border border-slate-700/80 bg-slate-900/80 p-4">
            <p className="content-page-label text-xs font-semibold uppercase tracking-wide text-blue-400">Admission Quick Guide</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-300">
              <li>• Collect the admission form from the school office.</li>
              <li>• Carry student birth proof and previous class marksheet.</li>
              <li>• Bring guardian identity and address proof for verification.</li>
              <li>• Submit within office hours: 10:00 AM - 3:00 PM.</li>
            </ul>
            <Link href="/contact" className="more-info-chip mt-4 inline-flex">Contact office</Link>
          </div>
        ) : null}
        </aside>
      </div>
    </div>
  );
}
