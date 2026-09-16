"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CreditCard,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface DuplicateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any | null;
  hostPasses: number;
  onOpenPaywall: () => void;
  onSuccess: (newEvent: any) => void;
}

export default function DuplicateEventModal({
  isOpen,
  onClose,
  event,
  hostPasses,
  onOpenPaywall,
  onSuccess,
}: DuplicateEventModalProps) {
  const [name, setName] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form whenever target event changes
  useEffect(() => {
    if (event) {
      setName(`${event.name} (Copy)`);
      setScheduledDate("");
      setError(null);
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const hasCredits = hostPasses > 0;

  // Helper function to set quick dates
  const setQuickDate = (daysFromNow: number, hour: number = 20) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hour, 0, 0, 0);

    // Format to YYYY-MM-DDTHH:MM for datetime-local
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    setScheduledDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    setError(null);
  };

  const handleDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasCredits) {
      onClose();
      onOpenPaywall();
      return;
    }

    if (!scheduledDate) {
      setError("Please select a scheduled date and time for the new event.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${event.id}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || `${event.name} (Copy)`,
          scheduledDate: new Date(scheduledDate).toISOString(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.code === "PAYWALL_REQUIRED") {
          onClose();
          onOpenPaywall();
        } else {
          setError(data.error || "Failed to duplicate event.");
        }
        return;
      }

      onSuccess(data.event);
      onClose();
    } catch (err: any) {
      console.error("Duplicate event error:", err);
      setError(err.message || "Failed to duplicate event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#0F1420] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Duplicate Event
            </h2>
            <p className="text-xs text-slate-400">
              Clone game settings, questions, and generate a new door code.
            </p>
          </div>
        </div>

        {/* Source Event Card */}
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl mb-5 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Source Game:</span>
            <span className="font-mono text-cyan-400 font-bold">
              Code: {event.doorCodeToken}
            </span>
          </div>
          <div className="font-bold text-white text-sm">{event.name}</div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              {event.venueName}
            </span>
            {event.themePack && (
              <>
                <span>•</span>
                <span className="text-slate-300">{event.themePack.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Credit / Pass Deduction Confirmation Box */}
        {hasCredits ? (
          <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl mb-5 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 mt-0.5 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <div className="font-bold text-cyan-200">
                1 Event Pass will be deducted
              </div>
              <p className="text-slate-300 leading-relaxed">
                You have{" "}
                <strong className="text-white">
                  {hostPasses} {hostPasses === 1 ? "pass" : "passes"}
                </strong>{" "}
                available. Duplicating will deduct 1 pass to provision the new room
                and immutable question bank.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl mb-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 mt-0.5 shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="text-xs space-y-1">
                <div className="font-bold text-amber-200">
                  0 Event Passes Remaining
                </div>
                <p className="text-slate-300 leading-relaxed">
                  You need 1 event pass to duplicate this game. Purchase an event
                  pass package to continue scheduling new games.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPaywall();
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-98"
            >
              <CreditCard className="w-4 h-4" />
              <span>Purchase Event Passes</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleDuplicate} className="space-y-4">
          {/* Game Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              New Game Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dub Step Dallas - Round 2"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              disabled={loading}
              maxLength={100}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              You can remove &quot;(Copy)&quot; or give this event a new custom title.
            </p>
          </div>

          {/* Scheduled Date & Time (Required) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Scheduled Date & Time{" "}
                <span className="text-cyan-400 font-extrabold">* Required</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => {
                  setScheduledDate(e.target.value);
                  setError(null);
                }}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors [color-scheme:dark]"
                disabled={loading}
              />
            </div>

            {/* Quick helper date presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 mr-1">Quick pick:</span>
              <button
                type="button"
                onClick={() => setQuickDate(1, 20)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-700 transition-all"
              >
                Tomorrow 8 PM
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const day = now.getDay();
                  const diff = (5 + 7 - day) % 7 || 7; // Next Friday
                  setQuickDate(diff, 20);
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-700 transition-all"
              >
                Next Friday 8 PM
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const day = now.getDay();
                  const diff = (6 + 7 - day) % 7 || 7; // Next Saturday
                  setQuickDate(diff, 20);
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-700 transition-all"
              >
                Next Saturday 8 PM
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>

            {hasCredits ? (
              <button
                type="submit"
                disabled={loading || !scheduledDate}
                className="py-2.5 px-5 bg-gradient-to-r from-cyan-400 to-teal-300 hover:brightness-110 text-black font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Duplicating Game...</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Duplicate & Use 1 Pass</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPaywall();
                }}
                className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-98"
              >
                <CreditCard className="w-4 h-4" />
                <span>Buy Passes to Duplicate</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
