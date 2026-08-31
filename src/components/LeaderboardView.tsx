"use client";

import React from "react";
import { Trophy, Medal, Award, Flame, Sparkles, Clock, Star } from "lucide-react";

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  shortCode: string;
  connectionsCount: number;
  completedSquaresCount: number;
  distinctTraitsCount: number;
  isCardCompleted: boolean;
}

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  currentPlayerId?: string;
  scoringModel?: string;
  prizeDescription?: string;
  timeRemainingSeconds?: number;
}

export function LeaderboardView({
  entries,
  currentPlayerId,
  scoringModel = "MOST_CONNECTIONS",
  prizeDescription,
  timeRemainingSeconds,
}: LeaderboardViewProps) {
  const isFirstToComplete = scoringModel === "FIRST_TO_COMPLETE";

  return (
    <div className="w-full max-w-md mx-auto flex flex-col pb-24 text-white">
      {/* Prize Header Card */}
      {prizeDescription && (
        <div className="p-4 bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-cyan-500/20 border border-amber-500/40 rounded-3xl mb-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black shrink-0 shadow-lg shadow-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block">
                Grand Prize
              </span>
              <p className="text-sm font-extrabold text-white leading-tight">
                {prizeDescription}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-300">
            <span className="font-medium">
              Mode:{" "}
              <strong className="text-cyan-300">
                {isFirstToComplete ? "First to Complete Card" : "Most Verified Meets"}
              </strong>
            </span>
            {timeRemainingSeconds !== undefined && timeRemainingSeconds > 0 && (
              <span className="flex items-center gap-1 font-mono text-amber-300 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {Math.floor(timeRemainingSeconds / 60)}m {timeRemainingSeconds % 60}s
                </span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
          <span>Rank & Player</span>
          <span>Score / Meets</span>
        </div>

        {entries.length === 0 ? (
          <div className="p-8 text-center bg-[#151C2C] rounded-2xl border border-slate-800">
            <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-bounce-subtle" />
            <p className="text-sm font-bold text-slate-300">No connections yet!</p>
            <p className="text-xs text-slate-400 mt-1">
              Be the first to scan someone and take the lead!
            </p>
          </div>
        ) : (
          entries.map((entry) => {
            const isCurrent = entry.playerId === currentPlayerId;
            const isTop1 = entry.rank === 1;
            const isTop2 = entry.rank === 2;
            const isTop3 = entry.rank === 3;

            return (
              <div
                key={entry.playerId}
                className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                  isCurrent
                    ? "bg-cyan-950/80 border-2 border-cyan-400 shadow-lg shadow-cyan-500/20"
                    : isTop1
                    ? "bg-gradient-to-r from-amber-950/70 to-[#151C2C] border border-amber-500/50"
                    : isTop2
                    ? "bg-[#151C2C] border border-slate-600/60"
                    : isTop3
                    ? "bg-[#151C2C] border border-amber-700/40"
                    : "bg-[#121824] border border-slate-800/80"
                }`}
              >
                {/* Left: Rank & Name */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 flex items-center justify-center font-black text-sm shrink-0">
                    {isTop1 ? (
                      <span className="w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-black shadow-md shadow-amber-400/40">
                        1
                      </span>
                    ) : isTop2 ? (
                      <span className="w-7 h-7 rounded-full bg-slate-300 text-black flex items-center justify-center font-black">
                        2
                      </span>
                    ) : isTop3 ? (
                      <span className="w-7 h-7 rounded-full bg-amber-700 text-white flex items-center justify-center font-black">
                        3
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">#{entry.rank}</span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-sm ${
                          isCurrent ? "text-cyan-300" : "text-white"
                        }`}
                      >
                        {entry.displayName}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 bg-cyan-400 text-black text-[9px] font-black rounded-md uppercase">
                          You
                        </span>
                      )}
                      {entry.isCardCompleted && (
                        <span className="px-1.5 py-0.5 bg-amber-500/30 border border-amber-400/60 text-amber-300 text-[9px] font-bold rounded-md flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-300" />
                          <span>BINGO</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>PIN: {entry.shortCode}</span>
                      <span>•</span>
                      <span>{entry.distinctTraitsCount} traits</span>
                    </div>
                  </div>
                </div>

                {/* Right: Score */}
                <div className="text-right">
                  <div className="text-base font-black text-cyan-400">
                    {entry.connectionsCount}{" "}
                    <span className="text-xs font-semibold text-slate-400">meets</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {entry.completedSquaresCount} squares
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
