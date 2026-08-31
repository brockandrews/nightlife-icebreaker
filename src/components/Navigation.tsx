"use client";

import React from "react";
import { Grid, QrCode, ScanLine, Trophy, ShieldAlert } from "lucide-react";

export type TabType = "card" | "my-id" | "scan" | "leaderboard";

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  connectionsCount?: number;
  hasPendingHandshake?: boolean;
}

export function Navigation({
  activeTab,
  setActiveTab,
  connectionsCount = 0,
  hasPendingHandshake = false,
}: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#121824]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 max-w-lg mx-auto">
      <div className="flex items-center justify-around">
        {/* Bingo Card Tab */}
        <button
          onClick={() => setActiveTab("card")}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all ${
            activeTab === "card"
              ? "text-cyan-400 font-semibold scale-105"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <Grid className="w-6 h-6" />
            {activeTab === "card" && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
            )}
          </div>
          <span className="text-[11px] mt-1">Bingo Card</span>
        </button>

        {/* My ID / QR Tab */}
        <button
          onClick={() => setActiveTab("my-id")}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all ${
            activeTab === "my-id"
              ? "text-purple-400 font-semibold scale-105"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <QrCode className="w-6 h-6" />
            {activeTab === "my-id" && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full" />
            )}
          </div>
          <span className="text-[11px] mt-1">My ID</span>
        </button>

        {/* Scan & Connect Tab (Hero CTA in middle) */}
        <button
          onClick={() => setActiveTab("scan")}
          className={`relative -top-3 flex flex-col items-center justify-center px-4 py-3 rounded-2xl transition-all shadow-lg ${
            activeTab === "scan"
              ? "bg-gradient-to-tr from-cyan-500 to-teal-400 text-black font-bold shadow-cyan-500/40 ring-4 ring-cyan-500/30 scale-105"
              : "bg-gradient-to-tr from-cyan-600 to-teal-500 text-black font-semibold shadow-cyan-900/50 hover:brightness-110"
          }`}
        >
          {hasPendingHandshake && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500 border-2 border-[#121824]"></span>
            </span>
          )}
          <ScanLine className="w-6 h-6" />
          <span className="text-[11px] font-bold">Scan / PIN</span>
        </button>

        {/* Leaderboard Tab */}
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all ${
            activeTab === "leaderboard"
              ? "text-amber-400 font-semibold scale-105"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <div className="relative">
            <Trophy className="w-6 h-6" />
            {connectionsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-500 text-black font-extrabold text-[9px] px-1.5 py-0.2 rounded-full">
                {connectionsCount}
              </span>
            )}
            {activeTab === "leaderboard" && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full" />
            )}
          </div>
          <span className="text-[11px] mt-1">Scores</span>
        </button>
      </div>
    </nav>
  );
}
