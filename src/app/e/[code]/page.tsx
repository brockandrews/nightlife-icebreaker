"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Trophy,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  MapPin,
} from "lucide-react";

export default function EventCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || "PILOT-2026";

  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Check if player is already logged into this event in localStorage
    const savedPlayer = localStorage.getItem(`player_${code.toUpperCase()}`);
    if (savedPlayer) {
      try {
        const parsed = JSON.parse(savedPlayer);
        if (parsed?.id) {
          router.replace(`/e/${code}/game`);
          return;
        }
      } catch (e) {}
    }

    async function fetchEvent() {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${code}`);
        const data = await res.json();
        if (data.success && data.event) {
          setEventData(data.event);
        } else {
          setError(data.error || "Event not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [code, router]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError("Please enter your nickname or first name");
      return;
    }

    if (!ageConfirmed) {
      setError("You must confirm you meet the venue age requirement");
      return;
    }

    // Save preliminary registration details in sessionStorage for the survey step
    sessionStorage.setItem(
      `reg_${code.toUpperCase()}`,
      JSON.stringify({
        displayName: displayName.trim(),
        ageConfirmed,
        marketingOptIn,
        contactEmail: email.trim() || undefined,
      })
    );

    router.push(`/e/${code}/survey`);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-5 text-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-300">Loading Event...</p>
      </main>
    );
  }

  if (error || !eventData) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-5 text-center max-w-sm mx-auto">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Event Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">
          {error || "Check your door code and try again."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl text-xs"
        >
          Return Home
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between p-5 max-w-md mx-auto">
      {/* Event Header Banner */}
      <div className="pt-2 pb-4">
        <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold mb-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{eventData.venueName}</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
          {eventData.name}
        </h1>

        {/* Prize Showcase Card */}
        {eventData.prizeDescription && (
          <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-cyan-500/20 border border-amber-500/40 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-amber-300 block">
                Tonight's Prize
              </span>
              <p className="text-xs font-bold text-white leading-tight">
                {eventData.prizeDescription}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Registration Form Card */}
      <form
        onSubmit={handleContinue}
        className="my-auto p-5 bg-[#151C2C] border border-slate-700/80 rounded-3xl shadow-2xl space-y-4"
      >
        <div className="text-center pb-1">
          <span className="text-xs uppercase tracking-wider font-bold text-cyan-400">
            Step 1 of 2
          </span>
          <h2 className="text-lg font-black text-white">Join the Human Bingo</h2>
        </div>

        {error && (
          <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            Your First Name or Nickname *
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Alex"
            maxLength={25}
            required
            className="w-full py-3 px-4 bg-[#0B0E14] border border-slate-700 focus:border-cyan-400 rounded-xl text-white font-semibold text-base focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Only your nickname will be visible to other players.
          </span>
        </div>

        {/* Age Gating */}
        <div className="p-3 bg-[#0C121E] border border-slate-800 rounded-xl flex items-start gap-3">
          <input
            type="checkbox"
            id="ageCheck"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
          />
          <label htmlFor="ageCheck" className="text-xs text-slate-300 select-none">
            I confirm I am 21+ (or meet this venue's legal entry age).
          </label>
        </div>

        {/* Optional Marketing Opt-In (PRD §9.3 Compliant: Unchecked by default) */}
        <div className="p-3 bg-[#0C121E] border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="marketingCheck"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
            />
            <label htmlFor="marketingCheck" className="text-xs text-slate-300 select-none">
              Notify me about future events & VIP promoter perks.
            </label>
          </div>

          {marketingOptIn && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address (optional)"
              className="w-full py-2 px-3 bg-[#0B0E14] border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
            />
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-cyan-400 to-teal-300 text-black font-black rounded-xl text-sm shadow-lg shadow-cyan-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <span>Next: Quick 45s Survey</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Footer / Safety / Legal */}
      <div className="text-center pt-3 text-[11px] text-slate-400 space-y-1">
        <p className="flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          <span>Platonic social networking • Performance-based prizes</span>
        </p>
        <p className="text-[10px]">
          By continuing, you agree to event house rules and terms.
        </p>
      </div>
    </main>
  );
}
