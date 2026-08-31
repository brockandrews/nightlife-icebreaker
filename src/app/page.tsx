"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  QrCode,
  Users,
  Trophy,
  ShieldCheck,
  ArrowRight,
  Zap,
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
      <div className="w-full flex items-center justify-between pt-2 pb-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-black flex items-center justify-center font-black shadow-lg shadow-cyan-500/30">
            <Zap className="w-5 h-5 fill-black" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white leading-none">
              NIGHTLIFE
            </h1>
            <span className="text-[10px] tracking-widest uppercase font-bold text-cyan-400">
              Icebreaker Bingo
            </span>
          </div>
        </div>

        <a
          href="/promoter"
          className="py-1.5 px-3 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition-all"
        >
          Host / Promoter
        </a>
      </div>

      {/* Hero Content */}
      <div className="w-full text-center my-auto py-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-4 animate-bounce-subtle">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Real-Time Social Game for Events</span>
        </div>

        <h2 className="text-4xl font-black tracking-tight text-white leading-tight mb-3">
          Meet Strangers. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300">
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

      {/* Feature Highlights */}
      <div className="w-full grid grid-cols-3 gap-2 pt-4 pb-2 border-t border-slate-800 text-center">
        <div className="p-2 rounded-xl bg-[#121824] border border-slate-800/80">
          <QrCode className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
          <span className="text-[10px] font-bold text-slate-300 block leading-tight">
            Mutual QR Handshake
          </span>
        </div>
        <div className="p-2 rounded-xl bg-[#121824] border border-slate-800/80">
          <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
          <span className="text-[10px] font-bold text-slate-300 block leading-tight">
            Live Venue Leaderboard
          </span>
        </div>
        <div className="p-2 rounded-xl bg-[#121824] border border-slate-800/80">
          <ShieldCheck className="w-4 h-4 text-green-400 mx-auto mb-1" />
          <span className="text-[10px] font-bold text-slate-300 block leading-tight">
            Safe & Platonic Only
          </span>
        </div>
      </div>
    </main>
  );
}
