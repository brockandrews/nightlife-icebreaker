"use client";

import React, { useState } from "react";
import { Sparkles, Check, Loader2, MessageSquare } from "lucide-react";

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
  // Pick exactly 1 random square from candidateSquares on mount
  const [chosenSquare] = useState<CandidateSquare | null>(() => {
    if (!candidateSquares || candidateSquares.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * candidateSquares.length);
    return candidateSquares[randomIndex];
  });

  const handleClaim = async (sq: CandidateSquare) => {
    await onSelectSquare(sq);
  };

  if (!chosenSquare) return null;

  const displayQuestion = chosenSquare.conversationPrompt
    ? chosenSquare.conversationPrompt.replace(/^["']|["']$/g, "")
    : chosenSquare.promptText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#151C2C] border-2 border-cyan-400 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center relative overflow-hidden">
        {/* Glow Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Icebreaker Match</span>
        </div>

        <h2 className="text-xl font-black text-white leading-tight">
          You matched with <span className="text-cyan-400">{partnerName}</span>!
        </h2>
        <p className="text-xs text-slate-300 mt-1 mb-4">
          Ask them this question to break the ice & stamp your square:
        </p>

        {/* Single Focused Challenge Card */}
        <div className="p-4 rounded-2xl bg-[#0E1420] border-2 border-cyan-500/40 shadow-xl text-left mb-5">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold uppercase tracking-wider mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Icebreaker Question</span>
          </div>

          {/* Bold Primary Print: The Question */}
          <p className="text-base sm:text-lg font-black text-white leading-snug tracking-tight">
            "{displayQuestion}"
          </p>

          {/* Smaller Subtext: Just the square text */}
          {chosenSquare.conversationPrompt && (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80">
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                {chosenSquare.promptText}
              </p>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => handleClaim(chosenSquare)}
          disabled={isLoading}
          className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-black font-extrabold rounded-2xl text-sm transition-all disabled:opacity-50 active:scale-98 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Stamping Square...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Stamp This Square</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-400 mt-3">
          Ask your match the question above, then tap to stamp!
        </p>
      </div>
    </div>
  );
}
