"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const showDetails = process.env.NODE_ENV !== "production";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <div className="card text-center">
        <p className="section-kicker">Something went wrong</p>
        <h2 className="section-title mt-2">Unable to load this page right now</h2>
        <p className="mt-3 text-sm text-slate-300">
          Please try again. If this continues, refresh the website or contact the school office.
        </p>

        {showDetails ? (
          <details className="mt-4 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3 text-left text-sm text-slate-300">
            <summary className="cursor-pointer font-semibold text-slate-200">Error Details</summary>
            <p className="mt-2 break-words">{error.message || "Unknown error"}</p>
            {error.digest ? <p className="mt-1 text-xs text-slate-400">Reference: {error.digest}</p> : null}
          </details>
        ) : null}

        <div className="mt-5 flex items-center justify-center gap-3">
          <button className="btn-primary" onClick={reset}>
            Try Again
          </button>
          <Link href="/" className="more-info-chip">
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
