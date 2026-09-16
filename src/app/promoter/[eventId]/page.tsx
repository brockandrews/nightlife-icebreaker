"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  Trophy,
  Zap,
  Play,
  Pause,
  Clock,
  Megaphone,
  Monitor,
  QrCode,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Loader2,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Flame,
  ShieldAlert,
  Search,
  CheckCircle2,
  Ban,
  Unlock,
  AlertCircle,
  Fingerprint,
  Pencil,
  Check,
  X,
  Copy,
} from "lucide-react";
import { TraitHeatmap } from "@/components/TraitHeatmap";
import DuplicateEventModal from "@/components/DuplicateEventModal";
import PaywallModal from "@/components/PaywallModal";
import confetti from "canvas-confetti";

export default function PromoterLiveConsole() {
  const params = useParams();
  const router = useRouter();
  const eventId = (params?.eventId as string) || "PILOT-2026";

  const [eventData, setEventData] = useState<any>(null);
  const [hudStats, setHudStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [traitHeat, setTraitHeat] = useState<any[]>([]);
  const [recentConnections, setRecentConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active right-column tab
  const [consoleTab, setConsoleTab] = useState<"stream" | "lookup" | "safety">("stream");

  // Broadcast Announcement State
  const [announcementText, setAnnouncementText] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Game control state
  const [controlling, setControlling] = useState(false);

  // Speed Round Timer State
  const [speedRoundRemaining, setSpeedRoundRemaining] = useState<number>(0);

  // Safety & Fraud Audit State
  const [safetyData, setSafetyData] = useState<{
    reports: any[];
    anomalies: any[];
    disqualifiedPlayers: any[];
  }>({ reports: [], anomalies: [], disqualifiedPlayers: [] });
  const [safetyLoading, setSafetyLoading] = useState(false);

  // Door Lookup State
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Event Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const handleSaveName = async () => {
    if (!editedName.trim() || !eventData) return;
    setSavingName(true);
    try {
      const res = await fetch(`/api/events/${eventData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editedName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.event) {
        setEventData((prev: any) => ({ ...prev, name: data.event.name }));
        setIsEditingName(false);
      } else {
        alert(data.error || "Failed to update event name");
      }
    } catch (err) {
      console.error("Error updating event name:", err);
      alert("Failed to update event name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  // Duplication & Pass Management State
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [hostInfo, setHostInfo] = useState<any>(null);

  const fetchHostInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.host) {
        setHostInfo(data.host);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchLiveStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/leaderboard/${eventId}`);
      const data = await res.json();
      if (data.success) {
        setEventData(data.event);
        setHudStats(data.hud);
        setLeaderboard(data.leaderboard || []);
        setTraitHeat(data.traitHeat || []);
        setRecentConnections(data.recentConnections || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchSafetyData = useCallback(async () => {
    if (!eventId) return;
    try {
      setSafetyLoading(true);
      const res = await fetch(`/api/promoter/safety?eventId=${eventId}`);
      const data = await res.json();
      if (data.success) {
        setSafetyData({
          reports: data.reports || [],
          anomalies: data.anomalies || [],
          disqualifiedPlayers: data.disqualifiedPlayers || [],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSafetyLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventData?.speedRoundActive || !eventData?.speedRoundEndTime) {
      setSpeedRoundRemaining(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(
        0,
        Math.floor(
          (new Date(eventData.speedRoundEndTime).getTime() - Date.now()) / 1000
        )
      );
      setSpeedRoundRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [eventData?.speedRoundActive, eventData?.speedRoundEndTime]);

  useEffect(() => {
    fetchLiveStats();
    fetchSafetyData();
    fetchHostInfo();

    // Subscribe to SSE event channel for live updates
    const sse = new EventSource(
      `/api/realtime/${encodeURIComponent(`event:${eventId}`)}`
    );

    sse.addEventListener("LEADERBOARD_UPDATE", () => {
      fetchLiveStats();
      fetchSafetyData();
    });

    sse.addEventListener("PLAYER_JOINED", () => {
      fetchLiveStats();
    });

    sse.addEventListener("GAME_STATE_UPDATE", () => {
      fetchLiveStats();
    });

    sse.addEventListener("SAFETY_REPORT_ALERT", () => {
      fetchSafetyData();
    });

    sse.addEventListener("SAFETY_UPDATE", () => {
      fetchSafetyData();
    });

    const interval = setInterval(() => {
      fetchLiveStats();
      fetchSafetyData();
    }, 6000);

    return () => {
      sse.close();
      clearInterval(interval);
    };
  }, [eventId, fetchLiveStats, fetchSafetyData]);

  // Handle Game Clock & Speed Mixer Controls
  const handleGameControl = async (action: string, durationMinutes?: number) => {
    if (!eventData?.id) return;
    setControlling(true);
    try {
      await fetch("/api/promoter/game-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventData.id,
          action,
          extendMinutes: 15,
          durationMinutes,
        }),
      });
      fetchLiveStats();
    } catch (e) {
      console.error(e);
    } finally {
      setControlling(false);
    }
  };

  // Handle Send Broadcast Announcement
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim() || !eventData?.id) return;
    setBroadcasting(true);
    try {
      const res = await fetch("/api/promoter/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventData.id,
          message: announcementText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncementText("");
        setBroadcastSuccess(true);
        setTimeout(() => setBroadcastSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBroadcasting(false);
    }
  };

  // Handle Safety Actions (Resolve, Dismiss, Disqualify, Reinstate)
  const handleSafetyAction = async (payload: {
    action: "RESOLVE_REPORT" | "DISMISS_REPORT" | "DISQUALIFY_PLAYER" | "REINSTATE_PLAYER";
    reportId?: string;
    playerId?: string;
    reason?: string;
    note?: string;
  }) => {
    try {
      await fetch("/api/promoter/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          eventId: eventData?.id || eventId,
        }),
      });
      fetchSafetyData();
      fetchLiveStats();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Door Lookup Search
  const handleLookup = async (query: string) => {
    if (!eventData?.id) return;
    setLookupLoading(true);
    try {
      const res = await fetch(
        `/api/promoter/guest-lookup?eventId=${eventData.id}&query=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();
      if (data.success) {
        setLookupResults(data.players || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle Clear Stuck Connection Attempt
  const handleClearStuckAttempt = async (attemptId: string) => {
    try {
      await fetch("/api/promoter/guest-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLEAR_STUCK_ATTEMPT", attemptId }),
      });
      handleLookup(lookupQuery);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !eventData) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-5 text-center text-white">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
        <h2 className="text-xl font-bold">Connecting to Live Event Console...</h2>
      </main>
    );
  }

  const isPaused = eventData.status === "PAUSED";
  const isCompleted = eventData.status === "COMPLETED";

  return (
    <main className="min-h-screen p-5 max-w-5xl mx-auto text-white">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/promoter")}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  eventData.status === "ACTIVE"
                    ? "bg-green-500/20 text-green-400 border border-green-500/40 animate-pulse"
                    : isPaused
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {eventData.status}
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                Code: {eventData.doorCodeToken}
              </span>
            </div>
            {isEditingName ? (
              <div className="flex items-center gap-2 my-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  className="px-3 py-1 bg-slate-900 border border-cyan-500 rounded-xl text-xl font-black text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-inner"
                  autoFocus
                  disabled={savingName}
                  maxLength={100}
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !editedName.trim()}
                  className="p-1.5 bg-cyan-400 hover:bg-cyan-300 text-black rounded-lg font-bold transition-all disabled:opacity-50"
                  title="Save Name"
                >
                  {savingName ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  disabled={savingName}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl font-black text-white leading-tight">
                  {eventData.name}
                </h1>
                <button
                  onClick={() => {
                    setEditedName(eventData.name);
                    setIsEditingName(true);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition-colors opacity-75 group-hover:opacity-100"
                  title="Edit Game Name"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400">📍 {eventData.venueName}</p>
          </div>
        </div>

        {/* Quick Nav Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push(`/promoter/${eventData.id}/projector`)}
            className="py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-teal-400 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            <Monitor className="w-4 h-4" />
            <span>Projector Mode</span>
          </button>

          <button
            onClick={() => router.push(`/promoter/${eventData.id}/qr`)}
            className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            <span>Door QR Flyer</span>
          </button>

          <button
            onClick={() => router.push(`/promoter/${eventData.id}/report`)}
            className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-400" />
            <span>Leads CSV</span>
          </button>

          {hostInfo?.role !== "DOOR_STAFF" && (
            <button
              onClick={() => setDuplicateModalOpen(true)}
              className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all"
              title="Duplicate this event for a future date"
            >
              <Copy className="w-4 h-4 text-cyan-400" />
              <span>Duplicate</span>
            </button>
          )}
        </div>
      </div>

      {/* Live HUD Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 bg-[#151C2C] border border-slate-800 rounded-2xl">
          <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
            Door Scans / Joined
          </span>
          <span className="text-3xl font-black text-white">
            {hudStats?.totalPlayers || 0}
          </span>
        </div>

        <div className="p-4 bg-[#151C2C] border border-slate-800 rounded-2xl">
          <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
            Surveys Finished
          </span>
          <span className="text-3xl font-black text-cyan-400">
            {hudStats?.totalSurveysCompleted || 0}
          </span>
        </div>

        <div className="p-4 bg-[#151C2C] border border-slate-800 rounded-2xl">
          <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
            Total Handshakes
          </span>
          <span className="text-3xl font-black text-purple-300">
            {hudStats?.totalConnections || 0}
          </span>
        </div>

        <div className="p-4 bg-[#151C2C] border border-slate-800 rounded-2xl">
          <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
            Median Meets / Player
          </span>
          <span className="text-3xl font-black text-amber-400">
            {hudStats?.medianConnections || 0}
          </span>
        </div>
      </div>

      {/* Main Two-Column Control Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Leaderboard Stream */}
        <div className="lg:col-span-2 space-y-6">
          {/* Host Game Clock Controls */}
          <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl shadow-xl">
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Game Status & Master Controls</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                Model: {eventData.scoringModel}
              </span>
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              {isPaused ? (
                <button
                  onClick={() => handleGameControl("RESUME")}
                  disabled={controlling}
                  className="py-2.5 px-4 bg-green-500 hover:bg-green-400 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Resume Game</span>
                </button>
              ) : (
                <button
                  onClick={() => handleGameControl("PAUSE")}
                  disabled={controlling || isCompleted}
                  className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Game</span>
                </button>
              )}

              <button
                onClick={() => handleGameControl("EXTEND")}
                disabled={controlling || isCompleted}
                className="py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <Clock className="w-4 h-4" />
                <span>+15 Min Clock</span>
              </button>

              <button
                onClick={() => handleGameControl("END_GAME")}
                disabled={controlling || isCompleted}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 ml-auto"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>End Game & Lock Scores</span>
              </button>
            </div>

            {/* Speed Mixer Lightning Blitz Controls (PRD §6.5) */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Speed Mixer Blitz:
                </span>
                {eventData?.speedRoundActive && (
                  <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-400 text-amber-300 rounded-full text-[10px] font-black uppercase animate-pulse">
                    ⚡ ACTIVE: {Math.floor(speedRoundRemaining / 60)}:
                    {(speedRoundRemaining % 60).toString().padStart(2, "0")} left
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!eventData?.speedRoundActive ? (
                  <>
                    <button
                      onClick={() => handleGameControl("START_SPEED_ROUND", 3)}
                      disabled={controlling || isCompleted}
                      className="py-1.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-extrabold rounded-lg text-xs flex items-center gap-1 transition-all disabled:opacity-40 shadow-sm"
                    >
                      <span>⚡ +3m Blitz</span>
                    </button>
                    <button
                      onClick={() => handleGameControl("START_SPEED_ROUND", 5)}
                      disabled={controlling || isCompleted}
                      className="py-1.5 px-3 bg-gradient-to-r from-orange-500 to-amber-400 hover:brightness-110 text-black font-extrabold rounded-lg text-xs flex items-center gap-1 transition-all disabled:opacity-40 shadow-sm"
                    >
                      <span>⚡ +5m Blitz</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleGameControl("END_SPEED_ROUND")}
                    disabled={controlling}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg text-xs flex items-center gap-1 transition-all border border-amber-500/40"
                  >
                    <span>Stop Blitz Early</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Live Leaderboard Standings */}
          <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-black text-white">
                  Live Standings & Tiebreakers
                </h2>
              </div>
              <button
                onClick={fetchLiveStats}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center bg-[#0B0E14] rounded-2xl text-slate-500 text-xs">
                  No verified connections recorded yet.
                </div>
              ) : (
                leaderboard.slice(0, 10).map((player) => (
                  <div
                    key={player.playerId}
                    className={`p-3 bg-[#0B0E14] border rounded-2xl flex items-center justify-between ${
                      player.isDisqualified
                        ? "border-red-500/40 opacity-50"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                          player.isDisqualified
                            ? "bg-red-950 text-red-400"
                            : "bg-slate-800 text-cyan-300"
                        }`}
                      >
                        {player.isDisqualified ? "✕" : `#${player.rank}`}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {player.displayName}
                          </span>
                          {player.isDisqualified && (
                            <span className="px-1.5 py-0.2 bg-red-900/60 border border-red-500 text-red-300 rounded text-[9px] font-black uppercase">
                              DISQUALIFIED
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          PIN: {player.shortCode} • {player.distinctTraitsCount} traits
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-cyan-400 block">
                        {player.connectionsCount} Meets
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {player.completedSquaresCount} squares
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Room Trait Heatmap & Category Pulse (PRD §6.5) */}
          <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h2 className="text-base font-black text-white">
                  Room Trait Heatmap & Mic Sparks
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Live Attendee Distribution
              </span>
            </div>

            <TraitHeatmap
              categories={traitHeat}
              totalPlayers={hudStats?.totalPlayers || 0}
            />
          </div>
        </div>

        {/* Right Column: Dynamic Promoter Tab Console */}
        <div className="space-y-6">
          {/* Tab Selector Header */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#101522] border border-slate-800 rounded-2xl">
            <button
              onClick={() => setConsoleTab("stream")}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                consoleTab === "stream"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Stream</span>
            </button>
            <button
              onClick={() => {
                setConsoleTab("lookup");
                if (lookupResults.length === 0) handleLookup("");
              }}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                consoleTab === "lookup"
                  ? "bg-cyan-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Door Help</span>
            </button>
            <button
              onClick={() => setConsoleTab("safety")}
              className={`py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
                consoleTab === "safety"
                  ? "bg-red-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Safety</span>
              {(safetyData.reports.filter((r) => r.status === "PENDING").length > 0 ||
                safetyData.anomalies.length > 0) && (
                <span className="w-2 h-2 rounded-full bg-red-400 absolute top-1 right-1 animate-ping" />
              )}
            </button>
          </div>

          {/* TAB 1: Stream & Broadcast */}
          {consoleTab === "stream" && (
            <>
              {/* Host Broadcast Banner Tool */}
              <div className="p-5 bg-gradient-to-br from-purple-950/80 to-[#151C2C] border border-purple-500/40 rounded-3xl shadow-xl">
                <div className="flex items-center gap-2 mb-3 text-purple-300">
                  <Megaphone className="w-5 h-5" />
                  <h2 className="text-base font-black text-white">
                    Push Room Announcement
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mb-3">
                  Sends an instant high-priority pop-up banner to all guests currently in the venue!
                </p>

                <form onSubmit={handleSendBroadcast} className="space-y-3">
                  <textarea
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="e.g. 15 minutes left before last call! Check the projector!"
                    rows={3}
                    required
                    className="w-full py-2.5 px-3 bg-[#0B0E14] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-400 resize-none"
                  />

                  <button
                    type="submit"
                    disabled={broadcasting || !announcementText.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:brightness-110 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-md shadow-purple-900/30"
                  >
                    {broadcasting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Broadcast to All Phones</span>
                  </button>

                  {broadcastSuccess && (
                    <p className="text-center text-xs font-bold text-green-400">
                      ✓ Broadcast sent successfully!
                    </p>
                  )}
                </form>
              </div>

              {/* Real-time Handshake Ticker */}
              <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    Live Handshake Stream
                  </h2>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {recentConnections.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">
                      Awaiting first handshake...
                    </p>
                  ) : (
                    recentConnections.map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 bg-[#0B0E14] border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-200">
                          <strong className="text-cyan-300">{c.playerA}</strong> 🤝{" "}
                          <strong className="text-purple-300">{c.playerB}</strong>
                          {c.isSpeedRound && (
                            <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[9px] font-black">
                              ⚡ BLITZ
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(c.confirmedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: Door Guest Support Lookup Tool (PRD §10.3) */}
          {consoleTab === "lookup" && (
            <div className="p-5 bg-[#151C2C] border border-cyan-500/30 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Search className="w-5 h-5" />
                  <h2 className="text-base font-black text-white">
                    Door Guest Support
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Attendee Lookup
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Search attendees by 4-letter PIN or name to verify status or unstick connection requests.
              </p>

              {/* Search Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => {
                    setLookupQuery(e.target.value);
                    handleLookup(e.target.value);
                  }}
                  placeholder="PIN or Attendee Name..."
                  className="w-full py-2 px-3 bg-[#0B0E14] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 font-mono uppercase"
                />
                <button
                  onClick={() => handleLookup(lookupQuery)}
                  disabled={lookupLoading}
                  className="px-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </button>
              </div>

              {/* Results List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {lookupResults.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    {lookupLoading ? "Searching..." : "No attendees found matching query."}
                  </p>
                ) : (
                  lookupResults.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-[#0B0E14] border border-slate-800 rounded-2xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{p.displayName}</span>
                            <span className="font-mono text-cyan-400 font-black px-1.5 py-0.2 bg-slate-800 rounded">
                              {p.shortCode}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block">
                            Joined {new Date(p.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-purple-300 block">
                            {p.connectionsCount} Meets
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {p.cardStats.completedSquares}/{p.cardStats.totalSquares} squares
                            {p.cardStats.hasWon && " 🏆 WON"}
                          </span>
                        </div>
                      </div>

                      {/* Stuck Attempts Resolution */}
                      {p.pendingAttempts.length > 0 && (
                        <div className="p-2 bg-amber-950/70 border border-amber-500/50 rounded-xl flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-amber-300 block">
                              ⏳ Pending Handshake ({p.pendingAttempts[0].remainingSeconds}s)
                            </span>
                            <span className="text-slate-300 text-[10px]">
                              With: {p.pendingAttempts[0].peer?.displayName} ({p.pendingAttempts[0].peer?.shortCode})
                            </span>
                          </div>
                          <button
                            onClick={() => handleClearStuckAttempt(p.pendingAttempts[0].id)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-lg text-[10px]"
                          >
                            Unstick
                          </button>
                        </div>
                      )}

                      {/* Disqualification / Status Badges */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                        {p.isDisqualified ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-red-400 font-bold">✕ Disqualified</span>
                            <button
                              onClick={() =>
                                handleSafetyAction({
                                  action: "REINSTATE_PLAYER",
                                  playerId: p.id,
                                })
                              }
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-green-400 font-bold rounded"
                            >
                              Reinstate
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              handleSafetyAction({
                                action: "DISQUALIFY_PLAYER",
                                playerId: p.id,
                                reason: "Host manual door intervention",
                              })
                            }
                            className="text-slate-500 hover:text-red-400 text-[10px] ml-auto font-medium"
                          >
                            Disqualify Account
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Safety & Fraud Audit Panel (PRD §2, §6.6, §9) */}
          {consoleTab === "safety" && (
            <div className="space-y-4">
              {/* Anti-Fraud Anomaly Audit Flags Card */}
              <div className="p-5 bg-[#151C2C] border border-amber-500/40 rounded-3xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Fingerprint className="w-5 h-5" />
                    <h2 className="text-base font-black text-white">
                      Prize Fraud Audit
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold">
                    {safetyData.anomalies.length} Flagged
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Automated scan of human connection velocities and card completion times before prize award.
                </p>

                <div className="space-y-2">
                  {safetyData.anomalies.length === 0 ? (
                    <div className="p-4 bg-[#0B0E14] border border-green-500/30 rounded-2xl flex items-center gap-2 text-green-400 text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>No suspicious velocity spikes detected. All connections within natural human parameters.</span>
                    </div>
                  ) : (
                    safetyData.anomalies.map((anom, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-amber-950/60 border border-amber-500/60 rounded-2xl text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white">{anom.displayName}</span>
                            <span className="font-mono text-amber-300 font-bold">
                              ({anom.shortCode})
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              anom.riskLevel === "HIGH"
                                ? "bg-red-500/30 text-red-300 border border-red-500"
                                : "bg-amber-500/30 text-amber-300 border border-amber-500"
                            }`}
                          >
                            {anom.riskLevel} RISK
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-200">{anom.details}</p>
                        <div className="flex items-center justify-between pt-1 border-t border-amber-900/60">
                          <span className="text-[10px] text-slate-400">
                            Action: {anom.recommendation}
                          </span>
                          {!anom.isDisqualified && (
                            <button
                              onClick={() =>
                                handleSafetyAction({
                                  action: "DISQUALIFY_PLAYER",
                                  playerId: anom.playerId,
                                  reason: `Fraud Anomaly: ${anom.details}`,
                                })
                              }
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white font-black rounded text-[10px]"
                            >
                              Disqualify
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Live Incident Reports Queue */}
              <div className="p-5 bg-[#151C2C] border border-red-500/40 rounded-3xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-400">
                    <ShieldAlert className="w-5 h-5" />
                    <h2 className="text-base font-black text-white">
                      Incident Reports Queue
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/20 text-red-300 rounded font-bold">
                    {safetyData.reports.length} Total
                  </span>
                </div>

                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {safetyData.reports.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">
                      No safety reports filed for this event.
                    </p>
                  ) : (
                    safetyData.reports.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 bg-[#0B0E14] border border-slate-800 rounded-2xl text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">
                            Target: <span className="text-red-400">{r.reported?.displayName || "Unknown"} ({r.reported?.shortCode || "N/A"})</span>
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              r.status === "PENDING"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500"
                                : r.status === "RESOLVED"
                                ? "bg-green-500/20 text-green-300 border border-green-500"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 italic bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          &ldquo;{r.reason}&rdquo;
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>By: {r.reporter?.displayName || "Guest"}</span>
                          <span>{new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>

                        {r.status === "PENDING" && (
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800">
                            <button
                              onClick={() =>
                                handleSafetyAction({
                                  action: "RESOLVE_REPORT",
                                  reportId: r.id,
                                })
                              }
                              className="flex-1 py-1 bg-green-700 hover:bg-green-600 text-white font-bold rounded-lg text-[10px]"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() =>
                                handleSafetyAction({
                                  action: "DISMISS_REPORT",
                                  reportId: r.id,
                                })
                              }
                              className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-[10px]"
                            >
                              Dismiss
                            </button>
                            {r.reported && !r.reported.isDisqualified && (
                              <button
                                onClick={() =>
                                  handleSafetyAction({
                                    action: "DISQUALIFY_PLAYER",
                                    playerId: r.reported.id,
                                    reportId: r.id,
                                    reason: `Safety Report: ${r.reason}`,
                                  })
                                }
                                className="py-1 px-2.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg text-[10px]"
                              >
                                Disqualify
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DuplicateEventModal
        isOpen={duplicateModalOpen}
        onClose={() => setDuplicateModalOpen(false)}
        event={eventData}
        hostPasses={(hostInfo?.freeEventsRemaining || 0) + (hostInfo?.purchasedCredits || 0)}
        onOpenPaywall={() => setPaywallOpen(true)}
        onSuccess={(newEvent) => {
          try {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          } catch (e) {}
          router.push(`/promoter/${newEvent.id}`);
        }}
      />

      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => {
          setPaywallOpen(false);
          fetchHostInfo();
        }}
      />
    </main>
  );
}
