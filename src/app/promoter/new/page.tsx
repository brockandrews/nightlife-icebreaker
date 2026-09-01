"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  Trophy,
  Grid,
  CheckCircle,
  Loader2,
  Calendar,
  MapPin,
  Flame,
} from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();
  const getDefaultScheduledDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [name, setName] = useState("");
  const [venueName, setVenueName] = useState("");
  const [scheduledDate, setScheduledDate] = useState(getDefaultScheduledDate());
  const [doorCodeToken, setDoorCodeToken] = useState("");
  const [cardSize, setCardSize] = useState<"5x5" | "4x4">("5x5");
  const [scoringModel, setScoringModel] = useState<
    "MOST_CONNECTIONS" | "FIRST_TO_COMPLETE"
  >("MOST_CONNECTIONS");
  const [completionMode, setCompletionMode] = useState<
    "AUTO_FILL" | "PROMPT_TO_REVEAL"
  >("AUTO_FILL");
  const [prizeDescription, setPrizeDescription] = useState(
    "VIP Bottle Service Package + Mystery Bar Tab"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !venueName.trim()) {
      setError("Please fill in event and venue names");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          venueName: venueName.trim(),
          scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : new Date().toISOString(),
          doorCodeToken: doorCodeToken.trim() || undefined,
          cardSize,
          scoringModel,
          completionMode,
          prizeDescription: prizeDescription.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.event) {
        router.push(`/promoter/${data.event.id}`);
      } else {
        setError(data.error || "Failed to create event");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create event");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-5 max-w-2xl mx-auto text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/promoter")}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-white">Create New Event</h1>
            <span className="text-xs text-slate-400">
              Configure your human bingo rules and game settings
            </span>
          </div>
        </div>
        <Link
          href="/logout"
          className="py-1.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold transition-all"
        >
          Log Out
        </Link>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <h2 className="text-sm font-black text-cyan-400 uppercase tracking-wider">
            1. Event & Venue Details
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Electric Mixer & Social Bingo"
              required
              className="w-full py-2.5 px-3.5 bg-[#0B0E14] border border-slate-700 focus:border-cyan-400 rounded-xl text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Venue Name *
            </label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. Club Velocity Lounge"
              required
              className="w-full py-2.5 px-3.5 bg-[#0B0E14] border border-slate-700 focus:border-cyan-400 rounded-xl text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Scheduled Event Date & Time *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
                className="w-full py-2.5 pl-10 pr-3.5 bg-[#0B0E14] border border-slate-700 focus:border-cyan-400 rounded-xl text-sm text-white focus:outline-none [color-scheme:dark]"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              When this icebreaker game is scheduled to run.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Door Code Token (Optional)
            </label>
            <input
              type="text"
              value={doorCodeToken}
              onChange={(e) => setDoorCodeToken(e.target.value.toUpperCase())}
              placeholder="e.g. VELOCITY-SAT (Auto-generated if empty)"
              className="w-full py-2.5 px-3.5 bg-[#0B0E14] border border-slate-700 focus:border-cyan-400 rounded-xl text-sm font-mono text-cyan-300 uppercase focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Guests can type this or scan the door QR to join.
            </span>
          </div>
        </div>

        {/* Game Rules & Mechanics */}
        <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <h2 className="text-sm font-black text-purple-400 uppercase tracking-wider">
            2. Game Mechanics & Scoring
          </h2>

          {/* Card Size */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Bingo Card Size
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCardSize("5x5")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  cardSize === "5x5"
                    ? "bg-purple-950/60 border-purple-400 text-white shadow-lg shadow-purple-900/30"
                    : "bg-[#0B0E14] border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">5 × 5 Grid</span>
                  {cardSize === "5x5" && (
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  24 challenges + Center Free Space (Standard 2–4 hr events)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCardSize("4x4")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  cardSize === "4x4"
                    ? "bg-purple-950/60 border-purple-400 text-white shadow-lg shadow-purple-900/30"
                    : "bg-[#0B0E14] border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">4 × 4 Grid</span>
                  {cardSize === "4x4" && (
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  16 challenges (Shorter 1–2 hr mixers & fast pacing)
                </p>
              </button>
            </div>
          </div>

          {/* Scoring Model */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Scoring & Winner Determination (PRD §5.6 & §9 Compliance)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScoringModel("MOST_CONNECTIONS")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  scoringModel === "MOST_CONNECTIONS"
                    ? "bg-cyan-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-900/30"
                    : "bg-[#0B0E14] border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">
                    Most Connections
                  </span>
                  {scoringModel === "MOST_CONNECTIONS" && (
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Winner is whoever meets the most people by last call. Rewards networking all night.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setScoringModel("FIRST_TO_COMPLETE")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  scoringModel === "FIRST_TO_COMPLETE"
                    ? "bg-cyan-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-900/30"
                    : "bg-[#0B0E14] border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">
                    First to Complete
                  </span>
                  {scoringModel === "FIRST_TO_COMPLETE" && (
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Winner is first player to finish a row or full card. High-energy race.
                </p>
              </button>
            </div>
          </div>

          {/* Completion Mode (A/B Test per PRD §5.5) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Square Completion Mode (A/B Test)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCompletionMode("AUTO_FILL")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  completionMode === "AUTO_FILL"
                    ? "bg-amber-950/60 border-amber-400 text-white shadow-lg shadow-amber-900/30"
                    : "bg-[#0B0E14] border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">
                    Auto-Fill (Fastest)
                  </span>
                  {completionMode === "AUTO_FILL" && (
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Matching squares fill immediately on mutual handshake.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCompletionMode("PROMPT_TO_REVEAL")}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  completionMode === "PROMPT_TO_REVEAL"
                    ? "bg-amber-950/60 border-amber-400 text-white shadow-lg shadow-amber-900/30"
                    : "bg-[#0B0E14] border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">
                    Prompt-to-Reveal
                  </span>
                  {completionMode === "PROMPT_TO_REVEAL" && (
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Reveals an icebreaker question to ask before completing the tile.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Prize Showcase */}
        <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider">
            3. Prize & Fulfillment (Display text)
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Grand Prize Description
            </label>
            <input
              type="text"
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
              placeholder="e.g. VIP Table with Bottle Service + $100 Bar Tab"
              required
              className="w-full py-2.5 px-3.5 bg-[#0B0E14] border border-slate-700 focus:border-amber-400 rounded-xl text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-cyan-400 to-teal-300 text-black font-black rounded-2xl text-base shadow-xl shadow-cyan-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Creating Event & Seeding Bank...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Launch Event & Open Live Console</span>
            </>
          )}
        </button>
      </form>
    </main>
  );
}
