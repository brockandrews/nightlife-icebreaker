import React from "react";
import Link from "next/link";
import { ArrowLeft, Scale, ShieldAlert, Award, AlertCircle, FileCheck } from "lucide-react";

export const metadata = {
  title: "Terms of Service | MixxSocial",
  description: "Terms of Service and Event Participation Rules for MixxSocial.",
};

export default function TermsOfServicePage() {
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
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                Terms of Service
              </h1>
              <span className="text-xs text-slate-400">
                Last updated: September 3, 2026
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mt-4">
            Welcome to MixxSocial (&ldquo;MixxSocial,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing or using our website at <strong>mixxsocial.com</strong>, hosting an event, or participating in an interactive icebreaker game, you agree to be bound by these Terms of Service.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-300">
          {/* Section 1 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              1. Platform Overview
            </h2>
            <p className="text-xs text-slate-400">
              MixxSocial provides digital software for real-time, in-person social icebreaker games at events, venues, mixers, and conferences. Guests participate by completing short surveys and connecting with other attendees via mutual QR handshakes to complete card challenges. Hosts create, customize, and administer these events through the Host Console.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              2. Skill & Achievement-Based Game Rules
            </h2>
            <p className="text-xs text-slate-400">
              MixxSocial games are strictly <strong>achievement and skill-based social competitions</strong>. Winners are determined objectively by verifiable social milestones (such as total confirmed mutual connections, distinct trait diversity, and completion time stamps) through server-authoritative scoring.
            </p>
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200 text-xs">
              <strong>No Gambling or Lottery:</strong> MixxSocial does not conduct lotteries, raffles, or games of chance. Any prizes or promotional perks advertised are provided and fulfilled exclusively by the independent event host or venue, not by MixxSocial.
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-green-400" />
              3. Guest Conduct & Safety
            </h2>
            <p className="text-xs text-slate-400">
              MixxSocial is designed to facilitate friendly, respectful, and safe real-world conversation. When participating in an event, you agree that you will not:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
              <li>Harass, stalk, threaten, demean, or inappropriately touch any other attendee.</li>
              <li>Attempt to scan another attendee&rsquo;s QR code without their express, voluntary consent.</li>
              <li>Manipulate, reverse-engineer, or attempt to falsify mutual handshake records.</li>
              <li>Circumvent cooldown timers, spoof player identifiers, or generate automated scans.</li>
            </ul>
            <p className="text-xs text-slate-400 pt-1">
              Any attendee may report inappropriate behavior or block connections directly within the mobile web app. Event hosts and venue management reserve the absolute right to disqualify participants or revoke venue access.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-400" />
              4. Host Responsibilities & Content Policies
            </h2>
            <p className="text-xs text-slate-400">
              Event Hosts are responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
              <li>Securing all necessary venue, municipal, and commercial permissions for their event.</li>
              <li>Fulfilling any promised prizes, giveaways, or incentives in good faith.</li>
              <li>Ensuring all custom questions and theme packs are free from hate speech, harassment, sexually explicit inquiries, or discriminatory content.</li>
              <li>Complying with venue age requirements and local regulations.</li>
            </ul>
            <p className="text-xs text-slate-400 pt-1">
              MixxSocial reserves the right to review, suspend, or remove any host account or event that violates our content guidelines or terms.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white">5. Account Registration & Security</h2>
            <p className="text-xs text-slate-400">
              Hosts must provide accurate information when registering an account. You are responsible for maintaining the confidentiality of your credentials (including third-party sign-in sessions) and for all activities that occur under your host account.
            </p>
          </section>

          {/* Section 6 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white">6. Intellectual Property</h2>
            <p className="text-xs text-slate-400">
              The MixxSocial name, logo, software, algorithms, visual design, and proprietary theme packs are the exclusive property of MixxSocial. You may not reproduce, distribute, or create derivative works without our prior written consent.
            </p>
          </section>

          {/* Section 7 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white">7. Disclaimer of Warranties & Limitation of Liability</h2>
            <p className="text-xs text-slate-400">
              MixxSocial is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. To the fullest extent permitted by law, MixxSocial disclaims all warranties, express or implied. In no event shall MixxSocial be liable for any indirect, incidental, special, or consequential damages arising from event attendance, venue interactions, prize disputes, or network outages during live events.
            </p>
          </section>

          {/* Section 8 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white">8. Changes to Terms</h2>
            <p className="text-xs text-slate-400">
              We may modify these Terms of Service from time to time. Continued use of MixxSocial following notice of changes constitutes acceptance of the updated terms.
            </p>
          </section>

          {/* Section 9 */}
          <section className="bg-[#151C2C] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
            <h2 className="text-base font-bold text-white">9. Contact Information</h2>
            <p className="text-xs text-slate-400">
              For questions regarding these Terms of Service, please contact us at:
            </p>
            <div className="text-xs font-mono text-cyan-300">
              MixxSocial Legal Team<br />
              Email: legal@mixxsocial.com<br />
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
