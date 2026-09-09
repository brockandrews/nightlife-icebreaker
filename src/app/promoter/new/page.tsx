"use client";

import React, { useState, useEffect } from "react";
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
  CreditCard,
  Briefcase,
  Globe,
  Users,
  GraduationCap,
  Heart,
  Wine,
  Eye,
  X,
  MessageSquare,
  ChevronRight,
  Layers,
} from "lucide-react";
import PaywallModal from "@/components/PaywallModal";

export interface ThemePackItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  targetAudience: string;
  tone: "playful" | "professional" | "warm";
  accentColor: string;
  iconName: string;
  cardSizeDefault: "5x5" | "4x4";
  isDefault?: boolean;
  order: number;
  questionCount: number;
  sampleQuestions: string[];
  questions: {
    id: string;
    category: string;
    prompt: string;
    options: string[];
    traitTemplate: string;
    conversationPrompt: string;
    order: number;
  }[];
}

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
  const [hostInfo, setHostInfo] = useState<any>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  // Theme Packs State
  const [themePacks, setThemePacks] = useState<ThemePackItem[]>([]);
  const [selectedPackSlug, setSelectedPackSlug] = useState<string>("nightlife");
  const [previewPack, setPreviewPack] = useState<ThemePackItem | null>(null);
  const [loadingPacks, setLoadingPacks] = useState<boolean>(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.host) {
          setHostInfo(d.host);
          const total =
            (d.host.freeEventsRemaining || 0) + (d.host.purchasedCredits || 0);
          if (total <= 0) {
            setPaywallOpen(true);
          }
        }
      })
      .catch(console.error);

    // Fetch published theme packs
    fetch("/api/theme-packs")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.themePacks) {
          setThemePacks(d.themePacks);
          const defaultPack =
            d.themePacks.find((p: ThemePackItem) => p.isDefault) ||
            d.themePacks[0];
          if (defaultPack) {
            setSelectedPackSlug(defaultPack.slug);
            setCardSize(defaultPack.cardSizeDefault || "5x5");
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingPacks(false));
  }, []);

  const totalCredits =
    (hostInfo?.freeEventsRemaining || 0) + (hostInfo?.purchasedCredits || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hostInfo && totalCredits <= 0) {
      setPaywallOpen(true);
      setError("An event pass is required to create a game. Please select a pass package.");
      return;
    }

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
          themePackSlug: selectedPackSlug,
          cardSize,
          scoringModel,
          completionMode,
          prizeDescription: prizeDescription.trim(),
        }),
      });

      const data = await res.json();
      if (res.status === 402 || data.code === "PAYWALL_REQUIRED") {
        setPaywallOpen(true);
        setError(data.error || "An event pass is required to create a game.");
        setLoading(false);
        return;
      }

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

  const selectedPack = themePacks.find((p) => p.slug === selectedPackSlug);

  const renderPackIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case "Flame":
        return <Flame className={className} />;
      case "Briefcase":
        return <Briefcase className={className} />;
      case "Globe":
        return <Globe className={className} />;
      case "Users":
        return <Users className={className} />;
      case "GraduationCap":
        return <GraduationCap className={className} />;
      case "Heart":
        return <Heart className={className} />;
      case "Wine":
        return <Wine className={className} />;
      case "Sparkles":
      default:
        return <Sparkles className={className} />;
    }
  };

  const getToneBadge = (tone: string) => {
    switch (tone) {
      case "playful":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Playful
          </span>
        );
      case "professional":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Professional
          </span>
        );
      case "warm":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Warm
          </span>
        );
      default:
        return null;
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

      {hostInfo && totalCredits <= 0 && (
        <div className="p-4 mb-6 bg-amber-950/60 border border-amber-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-xs text-amber-200">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>0 Event Passes Available.</strong> You have used your free event. An event pass is required to launch this game.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPaywallOpen(true)}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 text-black font-extrabold text-xs shrink-0 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Buy Passes</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Theme Pack Selection */}
        <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                1. Select Theme Pack
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Questions, prompts, and default card size adapt to your event type.
              </p>
            </div>
            {selectedPack && (
              <button
                type="button"
                onClick={() => setPreviewPack(selectedPack)}
                className="self-start sm:self-auto py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview Current Bank</span>
              </button>
            )}
          </div>

          {loadingPacks ? (
            <div className="p-8 text-center bg-[#0B0E14] rounded-2xl border border-slate-800">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading theme packs...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themePacks.map((pack) => {
                const isSelected = selectedPackSlug === pack.slug;
                return (
                  <div
                    key={pack.slug}
                    onClick={() => {
                      setSelectedPackSlug(pack.slug);
                      setCardSize(pack.cardSizeDefault || "5x5");
                    }}
                    role="button"
                    tabIndex={0}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#101726] border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-950/40"
                        : "bg-[#0B0E14] border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: `${pack.accentColor}20`,
                              color: pack.accentColor,
                              border: `1px solid ${pack.accentColor}40`,
                            }}
                          >
                            {renderPackIcon(pack.iconName, "w-4 h-4")}
                          </div>
                          <span className="text-sm font-black text-white leading-tight">
                            {pack.name}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mb-2 line-clamp-2 leading-relaxed">
                        {pack.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] mt-2">
                      <div className="flex items-center gap-1.5">
                        {getToneBadge(pack.tone)}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {pack.cardSizeDefault} Grid
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPack(pack);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 text-[11px] font-bold flex items-center gap-1 hover:underline"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <h2 className="text-sm font-black text-cyan-400 uppercase tracking-wider">
            2. Event & Venue Details
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
            3. Game Mechanics & Scoring
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
            4. Prize & Fulfillment (Display text)
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

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
      />

      {/* Theme Pack Question Preview Modal */}
      {previewPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#151C2C] border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#121824]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner shrink-0"
                  style={{
                    backgroundColor: `${previewPack.accentColor}25`,
                    color: previewPack.accentColor,
                    border: `1px solid ${previewPack.accentColor}50`,
                  }}
                >
                  {renderPackIcon(previewPack.iconName, "w-5 h-5")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">
                      {previewPack.name}
                    </h3>
                    {getToneBadge(previewPack.tone)}
                  </div>
                  <p className="text-xs text-slate-400">
                    {previewPack.targetAudience}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewPack(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Questions List */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-400">
                <span>Curated Question Bank ({previewPack.questions?.length || 8} Questions)</span>
                <span>Tap-only participant survey</span>
              </div>

              {previewPack.questions && previewPack.questions.length > 0 ? (
                previewPack.questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 bg-[#0B0E14] border border-slate-800 rounded-2xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-cyan-300 border border-slate-700">
                        Square #{idx + 1} • {q.category}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-white leading-snug">
                      {q.prompt}
                    </p>

                    {/* Options Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {q.options &&
                        q.options.map((opt: string, optIdx: number) => (
                          <span
                            key={optIdx}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs"
                          >
                            {opt}
                          </span>
                        ))}
                    </div>

                    {/* Conversation Starter Prompt */}
                    {q.conversationPrompt && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-300">Icebreaker Prompt: </strong>
                          <span>{q.conversationPrompt}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No questions loaded for this pack.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-[#121824] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPreviewPack(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all"
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedPackSlug(previewPack.slug);
                  setCardSize(previewPack.cardSizeDefault || "5x5");
                  setPreviewPack(null);
                }}
                className={`py-2.5 px-5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 ${
                  selectedPackSlug === previewPack.slug
                    ? "bg-slate-800 text-slate-400 cursor-default"
                    : "bg-gradient-to-r from-cyan-400 to-teal-300 text-black shadow-lg shadow-cyan-500/20 active:scale-95"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {selectedPackSlug === previewPack.slug
                    ? "Currently Selected"
                    : "Select This Theme Pack"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
