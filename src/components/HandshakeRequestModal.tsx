"use client";

import React, { useEffect, useState } from "react";
import { Check, X, Users, Loader2, Sparkles } from "lucide-react";

interface HandshakeRequestModalProps {
  // Mode: "INCOMING" (Player B receiving request) or "OUTGOING" (Player A waiting for B)
  mode: "INCOMING" | "OUTGOING";
  partnerName: string;
  partnerShortCode?: string;
  expiresAt: string;
  onConfirm?: () => Promise<void>;
  onDismiss?: () => void;
  isLoading?: boolean;
}

export function HandshakeRequestModal({
  mode,
  partnerName,
  partnerShortCode,
  expiresAt,
  onConfirm,
  onDismiss,
  isLoading = false,
}: HandshakeRequestModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);

  useEffect(() => {
    const targetTime = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        onDismiss?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onDismiss]);

  const percent = Math.min(100, Math.max(0, (secondsRemaining / 60) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#151C2C] border-2 border-cyan-400 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center relative overflow-hidden">
        {/* Animated Background Ring Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Circular Countdown Progress */}
        <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="text-slate-800"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="text-cyan-400 transition-all duration-1000 ease-linear"
              strokeWidth="8"
              strokeDasharray={264}
              strokeDashoffset={264 - (264 * percent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-2xl font-black font-mono text-white">
            {secondsRemaining}s
          </span>
        </div>

        {/* Icon & Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold mb-2">
          <Users className="w-3.5 h-3.5" />
          <span>{mode === "INCOMING" ? "Connection Request" : "Waiting for Verification"}</span>
        </div>

        {mode === "INCOMING" ? (
          <>
            <h3 className="text-xl font-black text-white leading-tight">
              Did you just meet <span className="text-cyan-400">{partnerName}</span>?
            </h3>
            {partnerShortCode && (
              <p className="text-xs font-mono font-bold text-slate-400 mt-1">
                PIN: {partnerShortCode}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-2 mb-6">
              Confirm in person to match your traits and complete your bingo squares.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onConfirm}
                disabled={isLoading || secondsRemaining <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-teal-300 text-black font-black rounded-xl text-base shadow-lg shadow-cyan-500/30 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>Yes, Confirm Meet!</span>
                  </>
                )}
              </button>

              <button
                onClick={onDismiss}
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold rounded-xl text-xs transition-all"
              >
                Not right now / Dismiss
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-black text-white leading-tight">
              Request Sent to <span className="text-cyan-400">{partnerName}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              Tell {partnerName} to tap <strong className="text-cyan-300">"Confirm"</strong> on their phone!
            </p>

            <div className="flex flex-col items-center justify-center p-3 bg-slate-900/80 rounded-xl mb-4 border border-slate-800">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-1" />
              <span className="text-xs font-medium text-slate-300">
                Listening for live confirmation...
              </span>
            </div>

            <button
              onClick={onDismiss}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold rounded-xl text-xs transition-all"
            >
              Cancel Request
            </button>
          </>
        )}
      </div>
    </div>
  );
}
