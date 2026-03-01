import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for Amarargarh High School website and published information.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <div className="card">
        <p className="section-kicker">Policy</p>
        <h1 className="section-title">Terms of Use</h1>
        <div className="section-divider" />
        <div className="space-y-3 text-sm leading-7 text-slate-300">
          <p>
            This website provides official school information for students, guardians, and visitors. Users should verify critical admissions or administrative details directly with the school office.
          </p>
          <p>
            Published notices, events, and school updates are intended for informational purposes and may be revised when required.
          </p>
          <p>
            Unauthorized misuse, copying with false claims, or tampering attempts related to this website are not permitted.
          </p>
          <p>
            By using this website, you agree to use the information responsibly and for lawful educational communication.
          </p>
          <p className="text-xs text-slate-400">Last updated: 01 Mar 2026</p>
        </div>
      </div>
    </section>
  );
}
