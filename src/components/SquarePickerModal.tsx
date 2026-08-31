"use client";

import React, { useState } from "react";
import { Sparkles, Check, ArrowRight, Loader2, MessageSquare, HelpCircle } from "lucide-react";

export interface CandidateSquare {
  id: string;
  position: number;
  promptText: string;
  conversationPrompt: string | null;
}

interface SquarePickerModalProps {
  partnerName: string;
  partnerId: string;
  candidateSquares: CandidateSquare[];
  cardSize?: string;
  onSelectSquare: (square: CandidateSquare) => Promise<void>;
  isLoading?: boolean;
}

export function SquarePickerModal({
  partnerName,
  partnerId,
  candidateSquares,
  cardSize = "5x5",
  onSelectSquare,
  isLoading = false,
}: SquarePickerModalProps) {
  const [selectedSquareId, setSelectedSquareId] = useState<string | null>(null);

  const size = cardSize === "5x5" ? 5 : 4;

  const handleClaim = async (sq: CandidateSquare) => {
    setSelectedSquareId(sq.id);
    await onSelectSquare(sq);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#151C2C] border-2 border-cyan-400 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center relative overflow-hidden">
        {/* Glow Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Strategic Match</span>
        </div>

        <h2 className="text-xl font-black text-white leading-tight">
          <span className="text-cyan-400">{partnerName}</span> matches {candidateSquares.length} challenges!
        </h2>
        <p className="text-xs text-slate-300 mt-1 mb-4">
          Each person can only stamp <strong>1 square</strong>. Pick which one helps your bingo line:
        </p>

        {/* List of Candidate Squares to Pick From */}
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 text-left mb-4">
          {candidateSquares.map((sq) => {
            const row = Math.floor(sq.position / size) + 1;
            const col = (sq.position % size) + 1;
            const isProcessing = selectedSquareId === sq.id && isLoading;

            return (
              <button
                key={sq.id}
                onClick={() => handleClaim(sq)}
                disabled={isLoading}
                className={`w-full p-3.5 rounded-2xl border transition-all text-left group active:scale-98 ${
                  selectedSquareId === sq.id
                    ? "bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-400/50"
                    : "bg-[#0E1420] hover:bg-[#131B2A] border-slate-700/80 hover:border-cyan-400/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300">
                    Row {row}, Col {col}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 group-hover:bg-cyan-400 text-cyan-300 group-hover:text-black flex items-center justify-center transition-all">
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    )}
                  </div>
                </div>

                <p className="text-xs font-bold text-white leading-snug">
                  {sq.promptText}
                </p>

                {sq.conversationPrompt && (
                  <p className="text-[11px] text-slate-400 italic mt-1 line-clamp-1">
                    "{sq.conversationPrompt}"
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-400">
          Tap any square above to stamp it & complete your match
        </p>
      </div>
    </div>
  );
}
