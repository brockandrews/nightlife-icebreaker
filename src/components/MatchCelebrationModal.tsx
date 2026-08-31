"use client";

import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Check, MessageSquare, PartyPopper, ArrowRight } from "lucide-react";

interface MatchedSquare {
  id: string;
  promptText: string;
  conversationPrompt: string | null;
}

interface MatchCelebrationModalProps {
  partnerName: string;
  matchedSquares: MatchedSquare[];
  completionMode?: string;
  onClose: () => void;
}

export function MatchCelebrationModal({
  partnerName,
  matchedSquares,
  completionMode = "AUTO_FILL",
  onClose,
}: MatchCelebrationModalProps) {
  const isPromptToReveal = completionMode === "PROMPT_TO_REVEAL";

  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#00F5D4", "#9D4EDD", "#FFB703", "#FF007F"],
      });
    } catch (e) {}
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#151C2C] border-2 border-cyan-400 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center relative overflow-hidden">
        {/* Top Glow */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-black mx-auto mb-3 flex items-center justify-center shadow-lg shadow-cyan-500/40">
          <PartyPopper className="w-8 h-8" />
        </div>

        <span className="text-xs uppercase tracking-widest font-bold text-cyan-400">
          Verified Connection!
        </span>
        <h2 className="text-2xl font-black text-white mt-0.5">
          You Met <span className="text-cyan-300">{partnerName}</span>!
        </h2>

        {matchedSquares.length > 0 ? (
          <div className="my-4">
            <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 rounded-2xl mb-3">
              <span className="text-xs font-bold text-cyan-300">
                ✨ 1 Bingo Square Stamped by {partnerName}!
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto text-left pr-1">
              {matchedSquares.map((sq) => (
                <div
                  key={sq.id}
                  className="p-3 bg-[#0E1420] border border-slate-700/80 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <p className="text-xs font-bold text-slate-200">
                      {sq.promptText}
                    </p>
                  </div>

                  {sq.conversationPrompt && (
                    <div className="mt-2 p-2 bg-purple-950/40 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-purple-300 uppercase">
                        <MessageSquare className="w-3 h-3" />
                        <span>Conversation Prompt</span>
                      </div>
                      <p className="text-xs text-slate-300 italic mt-0.5">
                        "{sq.conversationPrompt}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="my-4 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-300">
              You connected with <strong>{partnerName}</strong>! While none of their survey traits matched your remaining open squares this round, this adds to your total connections score!
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-teal-300 text-black font-extrabold rounded-xl text-sm shadow-lg shadow-cyan-500/30 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <span>Continue Playing</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
