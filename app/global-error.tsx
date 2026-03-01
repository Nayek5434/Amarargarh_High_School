"use client";

import Link from "next/link";
import { useEffect } from "react";

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
    <html lang="en">
      <body>
        <main className="container-main py-10">
          <section className="mx-auto max-w-2xl space-y-5">
            <div className="card text-center">
              <p className="section-kicker">System error</p>
              <h1 className="section-title mt-2">The website is temporarily unavailable</h1>
              <p className="mt-3 text-sm text-slate-300">
                Please try again in a moment. If the issue continues, contact the school office.
              </p>

              {showDetails ? (
                <details className="mt-4 rounded-xl border border-slate-700/70 bg-slate-900/50 p-3 text-left text-sm text-slate-300">
                  <summary className="cursor-pointer font-semibold text-slate-200">Error Details</summary>
                  <p className="mt-2 break-words">{error.message || "Unknown error"}</p>
                  {error.digest ? <p className="mt-1 text-xs text-slate-400">Reference: {error.digest}</p> : null}
                </details>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button type="button" className="btn-primary" onClick={reset}>
                  Try Again
                </button>
                <Link href="/" className="more-info-chip">
                  Go to Home
                </Link>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
