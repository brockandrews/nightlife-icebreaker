"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";

interface BroadcastBannerProps {
  message: string | null;
  onDismiss?: () => void;
}

export function BroadcastBanner({ message, onDismiss }: BroadcastBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      // Trigger haptic vibration for room announcement alert
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate([100, 60, 140]);
        } catch (e) {}
      }
    } else {
      setVisible(false);
    }
  }, [message]);

  if (!visible || !message) return null;

  return (
    <div className="fixed top-4 left-3 right-3 z-[100] max-w-md mx-auto transition-all animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="p-4 bg-gradient-to-br from-[#1c1033]/95 via-[#151C2C]/95 to-[#0B0E14]/95 border-2 border-purple-400/90 rounded-2xl shadow-2xl shadow-purple-950/60 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/40">
            <Megaphone className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-purple-300 bg-purple-900/60 border border-purple-500/40 px-2 py-0.5 rounded-full">
                Host Announcement
              </span>
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
            </div>
            <p className="text-sm font-extrabold text-white mt-1.5 leading-snug break-words">
              {message}
            </p>
          </div>

          <button
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
            aria-label="Close announcement"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 pt-2.5 border-t border-purple-800/40 flex justify-end">
          <button
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
            className="px-3.5 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/60 text-purple-200 text-xs font-bold rounded-lg transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
