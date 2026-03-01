import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <div className="card text-center">
        <p className="section-kicker">Error 404</p>
        <h1 className="section-title mt-2">Page not found</h1>
        <p className="mt-3 text-sm text-slate-300">
          The page may have moved or the link may be incorrect. Use the quick actions below to continue browsing.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn-primary">
            Go to Home
          </Link>
          <Link href="/notices" className="more-info-chip">
            Latest Notices
          </Link>
          <Link href="/contact" className="more-info-chip">
            Contact School
          </Link>
        </div>
      </div>
    </section>
  );
}
