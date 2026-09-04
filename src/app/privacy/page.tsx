import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | MixxSocial",
  description: "Privacy Policy and Data Protection practices for MixxSocial event icebreaker platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0B0E14] text-slate-200 py-12 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to MixxSocial</span>
        </Link>

        {/* Header */}
        <div className="border-b border-slate-800 pb-8 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Privacy Policy
              </h1>
              <span className="text-xs text-slate-400">
                Last updated: September 3, 2026
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mt-4">
            MixxSocial (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you visit <strong>mixxsocial.com</strong>, host an event, or participate in an interactive icebreaker session.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          {/* Section 1 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              1. Information We Collect
            </h2>
            <p>
              We collect information in two primary capacities: as an <strong>Event Host</strong> creating and administering games, and as a <strong>Guest</strong> participating in an event.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-[#0B0E14] border border-slate-800 rounded-xl">
                <strong className="text-white block text-xs uppercase tracking-wider mb-1">
                  A. Event Host Account Information
                </strong>
                <p className="text-xs text-slate-400">
                  When you register for a host account via email or third-party identity providers (such as Google Sign-In), we collect your name, email address, organization/venue name, and authentication identifiers. If you authenticate with Google, we access only your basic profile information (name, email, and avatar) authorized during OAuth consent.
                </p>
              </div>

              <div className="p-3 bg-[#0B0E14] border border-slate-800 rounded-xl">
                <strong className="text-white block text-xs uppercase tracking-wider mb-1">
                  B. Guest Participation Data (No Account Required)
                </strong>
                <p className="text-xs text-slate-400">
                  Guests join events without creating an account. Guests provide a display name and answers to 8–12 multiple-choice survey questions. This data is used solely to generate personalized cards and verify matching traits during in-person QR handshakes.
                </p>
              </div>

              <div className="p-3 bg-[#0B0E14] border border-slate-800 rounded-xl">
                <strong className="text-white block text-xs uppercase tracking-wider mb-1">
                  C. Optional Marketing Consent
                </strong>
                <p className="text-xs text-slate-400">
                  Guests may optionally provide contact details (such as email or phone) if an event host provides a giveaway. Marketing consent is strictly explicit, separate, and non-required. Declining consent never impairs participation in the icebreaker game.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              2. How We Use Your Information
            </h2>
            <p>We use collected information strictly for operational and game-facilitation purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
              <li>To provide, operate, and maintain the MixxSocial web application.</li>
              <li>To evaluate mutual trait compatibility and award card squares upon verified mutual scans.</li>
              <li>To calculate real-time, server-authoritative leaderboard rankings based strictly on achievement.</li>
              <li>To provide authenticated event hosts with aggregate analytics (attendance, verified connections, completion funnels).</li>
              <li>To detect and prevent cheating, automated bot scans, or abusive behavior during live events.</li>
            </ul>
            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-200 text-xs mt-2">
              <strong>Google User Data Compliance:</strong> MixxSocial uses Google user data exclusively for account authentication and user profile display. We do not sell Google user data, share it with advertising brokers, or use it to train generalized AI/ML models.
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              3. Data Sharing & Disclosure
            </h2>
            <p>
              We do not sell, rent, or trade your personal information. We disclose information only under the following limited circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
              <li>
                <strong>Event Hosts:</strong> Hosts receive aggregated metrics and, where guests explicitly opted in, contact info collected for prize distribution.
              </li>
              <li>
                <strong>Infrastructure Providers:</strong> Trusted third-party vendors who assist in operating our platform under strict confidentiality agreements, including Supabase (cloud database & authentication hosting) and Vercel (application infrastructure).
              </li>
              <li>
                <strong>Legal Requirements:</strong> If required by law, subpoena, or to protect the vital safety of attendees and venues.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-pink-400" />
              4. Cookies and Session Storage
            </h2>
            <p className="text-xs text-slate-400">
              MixxSocial uses strictly necessary HTTP cookies and local browser storage to manage host authentication sessions and maintain active guest player states during live games. We do not use third-party cross-site advertising tracking cookies.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white">5. Data Retention & Deletion</h2>
            <p className="text-xs text-slate-400">
              Guest play tokens and live connection attempts are retained for the duration of the event and audit period. Hosts may request account deletion or export their event data at any time by contacting us at <strong>privacy@mixxsocial.com</strong>.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white">6. Children&rsquo;s Privacy</h2>
            <p className="text-xs text-slate-400">
              MixxSocial is designed for social, corporate, and venue mixer events and is not directed to children under 13. We do not knowingly collect personal information from children under 13.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white">7. Contact Us</h2>
            <p className="text-xs text-slate-400">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact us at:
            </p>
            <div className="text-xs font-mono text-cyan-300">
              MixxSocial Privacy Team<br />
              Email: privacy@mixxsocial.com<br />
              Website: https://mixxsocial.com
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} MixxSocial. All rights reserved.
        </div>
      </div>
    </main>
  );
}
