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
    } else {
      setVisible(false);
    }
  }, [message]);

  if (!visible || !message) return null;

  return (
    <div className="fixed top-3 left-3 right-3 z-50 max-w-md mx-auto animate-bounce-subtle">
      <div className="p-4 bg-gradient-to-r from-purple-900/95 to-[#151C2C]/95 border-2 border-purple-400 rounded-2xl shadow-2xl backdrop-blur-xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/40">
          <Megaphone className="w-4 h-4 animate-pulse" />
        </div>

        <div className="flex-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300 block">
            Host Announcement
          </span>
          <p className="text-xs font-bold text-white mt-0.5 leading-snug">
            {message}
          </p>
        </div>

        <button
          onClick={() => {
            setVisible(false);
            onDismiss?.();
          }}
          className="text-slate-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
