"use client";

import React, { useState } from "react";
import { Check, Star, Sparkles, MessageCircle, X } from "lucide-react";

export interface CardSquareData {
  id: string;
  position: number;
  traitId: string;
  promptText: string;
  conversationPrompt: string | null;
  isFreeSpace: boolean;
  isCompleted: boolean;
  matchedPlayerName?: string | null;
  completedAt?: string | null;
}

export interface CardData {
  id: string;
  isCompleted: boolean;
  winningLineType?: string | null;
  squares: CardSquareData[];
}

interface BingoCardProps {
  card: CardData | null;
  cardSize?: string;
  onSelectSquare?: (square: CardSquareData) => void;
}

export function BingoCard({
  card,
  cardSize = "5x5",
  onSelectSquare,
}: BingoCardProps) {
  const [selectedSquare, setSelectedSquare] = useState<CardSquareData | null>(null);

  if (!card || !card.squares || card.squares.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#121824] rounded-2xl border border-slate-800 text-center animate-pulse">
        <Sparkles className="w-8 h-8 text-cyan-400 mb-2 animate-spin" />
        <p className="text-slate-300 font-medium">Generating your custom card...</p>
      </div>
    );
  }

  const squares = [...card.squares].sort((a, b) => a.position - b.position);
  const is5x5 = cardSize === "5x5";
  const gridColsClass = is5x5 ? "grid-cols-5" : "grid-cols-4";

  const completedCount = squares.filter((s) => s.isCompleted && !s.isFreeSpace).length;
  const totalCount = is5x5 ? 24 : 16;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Progress Header */}
      <div className="w-full mb-3 flex items-center justify-between px-1">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Progress
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-black text-cyan-400">{completedCount}</span>
            <span className="text-xs text-slate-400">/ {totalCount} squares</span>
          </div>
        </div>

        {card.isCompleted && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-300 text-xs font-bold animate-bounce-subtle">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BINGO! ({card.winningLineType || "WIN"})</span>
          </div>
        )}

        <div className="w-24 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700">
          <div
            className="bg-gradient-to-r from-cyan-500 to-teal-400 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grid */}
      <div
        className={`grid ${gridColsClass} gap-1.5 w-full aspect-square bg-[#0D121D] p-2 rounded-2xl border border-slate-800/80 shadow-2xl`}
      >
        {squares.map((sq) => {
          const isFree = sq.isFreeSpace;
          const isDone = sq.isCompleted;

          return (
            <button
              key={sq.id}
              onClick={() => {
                setSelectedSquare(sq);
                onSelectSquare?.(sq);
              }}
              className={`relative flex flex-col items-center justify-center p-1 rounded-xl text-center transition-all transform active:scale-95 select-none overflow-hidden ${
                isFree
                  ? "bg-gradient-to-br from-amber-500/20 via-purple-600/20 to-cyan-500/20 border-2 border-amber-400/80 shadow-amber-500/20"
                  : isDone
                  ? "bg-gradient-to-br from-cyan-950/80 to-teal-900/90 border-2 border-cyan-400/90 shadow-lg shadow-cyan-500/20"
                  : "bg-[#161D2C] border border-slate-700/60 hover:border-slate-500/80 active:bg-slate-800"
              }`}
            >
              {/* Free Space */}
              {isFree ? (
                <div className="flex flex-col items-center justify-center">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                  <span className="text-[9px] font-black text-amber-300 uppercase tracking-tighter mt-0.5">
                    FREE
                  </span>
                </div>
              ) : isDone ? (
                /* Completed Space */
                <div className="flex flex-col items-center justify-center w-full h-full p-0.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center mb-0.5 shadow-sm shadow-cyan-300">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-[8px] font-bold text-cyan-200 line-clamp-1 leading-tight">
                    {sq.matchedPlayerName || "Matched"}
                  </span>
                </div>
              ) : (
                /* Uncompleted Space */
                <div className="flex flex-col items-center justify-center w-full h-full p-0.5">
                  <p className="text-[9px] font-medium text-slate-300 line-clamp-3 leading-tight">
                    {sq.promptText.replace(/^Find someone who\s*/i, "")}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Tile Detail Popup Modal */}
      {selectedSquare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#151C2C] border border-cyan-500/40 rounded-3xl p-5 w-full max-w-sm shadow-2xl relative">
            <button
              onClick={() => setSelectedSquare(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              {selectedSquare.isCompleted ? (
                <div className="w-8 h-8 rounded-full bg-cyan-500 text-black flex items-center justify-center font-bold">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 text-cyan-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  {selectedSquare.isFreeSpace
                    ? "Free Center Tile"
                    : selectedSquare.isCompleted
                    ? "Completed Challenge"
                    : "Target Challenge"}
                </span>
                <h3 className="text-base font-bold text-white leading-snug">
                  {selectedSquare.promptText}
                </h3>
              </div>
            </div>

            {selectedSquare.isCompleted && selectedSquare.matchedPlayerName && (
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl mb-3">
                <span className="text-xs text-slate-400 block">Matched with</span>
                <span className="text-sm font-bold text-cyan-300">
                  ✨ {selectedSquare.matchedPlayerName}
                </span>
              </div>
            )}

            {selectedSquare.conversationPrompt && !selectedSquare.isFreeSpace && (
              <div className="p-3 bg-[#0F1522] border border-slate-800 rounded-xl mb-4">
                <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold mb-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Conversation Icebreaker</span>
                </div>
                <p className="text-xs text-slate-300 italic">
                  "{selectedSquare.conversationPrompt}"
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedSquare(null)}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-400 text-black font-bold rounded-xl text-sm"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
