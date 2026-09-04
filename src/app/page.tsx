"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  QrCode,
  Users,
  Trophy,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [doorCode, setDoorCode] = useState("PILOT-2026");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (doorCode.trim()) {
      router.push(`/e/${doorCode.trim().toUpperCase()}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-5 max-w-lg mx-auto">
      {/* Top Header */}
      <header className="w-full flex items-center justify-between pt-2 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#151C2C] border border-cyan-500/30 flex items-center justify-center p-1.5 shadow-lg shadow-cyan-500/20">
            <img
              src="/logo.svg"
              alt="MixxSocial Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white leading-none">
              Mixx<span className="text-cyan-400">Social</span>
            </h1>
            <span className="text-[10px] tracking-wider uppercase font-bold text-slate-400">
              Event Icebreaker Platform
            </span>
          </div>
        </div>

        <Link
          href="/promoter"
          className="py-1.5 px-3.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition-all shadow-sm"
        >
          Host / Promoter
        </Link>
      </header>

      {/* Hero Content */}
      <div className="w-full text-center my-auto py-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Social Game for Events</span>
        </div>

        <h2 className="text-4xl font-black tracking-tight text-white leading-tight mb-3">
          Meet Strangers. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400">
            Play Human Bingo.
          </span>
        </h2>

        <p className="text-sm text-slate-300 max-w-xs mx-auto mb-8">
          Scan the door code, complete a 45s survey, and connect with people in the room to fill your card and win the night!
        </p>

        {/* Join by Code Form */}
        <form
          onSubmit={handleJoin}
          className="p-5 bg-[#151C2C] border-2 border-cyan-500/30 rounded-3xl shadow-2xl space-y-4"
        >
          <div className="text-left">
            <label className="block text-xs uppercase tracking-wider font-bold text-slate-400 mb-1.5">
              Event Door Code
            </label>
            <div className="relative">
              <input
                type="text"
                value={doorCode}
                onChange={(e) => setDoorCode(e.target.value.toUpperCase())}
                placeholder="e.g. PILOT-2026"
                required
                className="w-full py-3.5 px-4 bg-[#0B0E14] border border-slate-700 focus:border-cyan-400 rounded-2xl text-center text-xl font-mono font-black text-cyan-300 uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-cyan-500/20 shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-cyan-400 to-teal-300 hover:from-cyan-300 hover:to-teal-200 text-black font-black rounded-2xl text-base shadow-xl shadow-cyan-500/30 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Enter Event & Play</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Feature Highlights & Footer */}
      <div className="w-full space-y-4 pt-4 border-t border-slate-800">
        <div className="w-full grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-[#121824] border border-slate-800/80">
            <QrCode className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-300 block leading-tight">
              Mutual QR Handshake
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#121824] border border-slate-800/80">
            <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-300 block leading-tight">
              Live Leaderboard
            </span>
          </div>
          <div className="p-2 rounded-xl bg-[#121824] border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-green-400 mx-auto mb-1" />
            <span className="text-[10px] font-bold text-slate-300 block leading-tight">
              Safe & Platonic Only
            </span>
          </div>
        </div>

        {/* Legal Footer */}
        <footer className="pt-3 pb-2 text-center space-y-2 border-t border-slate-900">
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-400">
            <Link
              href="/privacy"
              className="hover:text-cyan-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <span>•</span>
            <Link
              href="/terms"
              className="hover:text-cyan-400 transition-colors"
            >
              Terms of Service
            </Link>
            <span>•</span>
            <a
              href="mailto:support@mixxsocial.com"
              className="hover:text-cyan-400 transition-colors"
            >
              Support
            </a>
          </div>
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} MixxSocial. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}
