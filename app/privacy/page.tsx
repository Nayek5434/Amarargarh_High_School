import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Amarargarh High School website and communication channels.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-5">
      <div className="card">
        <p className="section-kicker">Policy</p>
        <h1 className="section-title">Privacy Policy</h1>
        <div className="section-divider" />
        <div className="space-y-3 text-sm leading-7 text-slate-300">
          <p>
            Amarargarh High School collects only necessary information for admissions, notices, academic communication, and school administration.
          </p>
          <p>
            Contact details submitted through school channels are used only for official communication. We do not sell or share personal information for marketing.
          </p>
          <p>
            Student and guardian records are handled with appropriate care and access is limited to authorized school staff.
          </p>
          <p>
            For correction or removal requests related to public website content, please contact the school office.
          </p>
          <p className="text-xs text-slate-400">Last updated: 01 Mar 2026</p>
        </div>
      </div>
    </section>
  );
}
