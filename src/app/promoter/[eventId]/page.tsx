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
} from "lucide-react";

export default function PromoterLiveConsole() {
  const params = useParams();
  const router = useRouter();
  const eventId = (params?.eventId as string) || "PILOT-2026";

  const [eventData, setEventData] = useState<any>(null);
  const [hudStats, setHudStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [recentConnections, setRecentConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Broadcast Announcement State
  const [announcementText, setAnnouncementText] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Game control state
  const [controlling, setControlling] = useState(false);

  const fetchLiveStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/leaderboard/${eventId}`);
      const data = await res.json();
      if (data.success) {
        setEventData(data.event);
        setHudStats(data.hud);
        setLeaderboard(data.leaderboard || []);
        setRecentConnections(data.recentConnections || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchLiveStats();

    // Subscribe to SSE event channel for live updates
    const sse = new EventSource(
      `/api/realtime/${encodeURIComponent(`event:${eventId}`)}`
    );

    sse.addEventListener("LEADERBOARD_UPDATE", () => {
      fetchLiveStats();
    });

    sse.addEventListener("PLAYER_JOINED", () => {
      fetchLiveStats();
    });

    sse.addEventListener("GAME_STATE_UPDATE", () => {
      fetchLiveStats();
    });

    const interval = setInterval(fetchLiveStats, 5000);

    return () => {
      sse.close();
      clearInterval(interval);
    };
  }, [eventId, fetchLiveStats]);

  // Handle Game Clock Controls
  const handleGameControl = async (action: string) => {
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
            <h1 className="text-2xl font-black text-white leading-tight">
              {eventData.name}
            </h1>
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
                    className="p-3 bg-[#0B0E14] border border-slate-800 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-cyan-300 flex items-center justify-center font-black text-xs">
                        #{player.rank}
                      </span>
                      <div>
                        <span className="text-sm font-bold text-white block">
                          {player.displayName}
                        </span>
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
        </div>

        {/* Right Column: Host Broadcast & Activity Stream */}
        <div className="space-y-6">
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
        </div>
      </div>
    </main>
  );
}
