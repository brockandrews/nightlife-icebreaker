"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import {
  Trophy,
  Sparkles,
  Zap,
  Clock,
  QrCode,
  Flame,
  Star,
  Users,
} from "lucide-react";

export default function ProjectorBigScreenView() {
  const params = useParams();
  const eventId = (params?.eventId as string) || "PILOT-2026";

  const [eventData, setEventData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [recentConnections, setRecentConnections] = useState<any[]>([]);
  const [hudStats, setHudStats] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const fetchLiveState = useCallback(async () => {
    try {
      const res = await fetch(`/api/leaderboard/${eventId}`);
      const data = await res.json();
      if (data.success) {
        setEventData(data.event);
        setLeaderboard(data.leaderboard || []);
        setRecentConnections(data.recentConnections || []);
        setHudStats(data.hud);

        if (data.event?.gameEndTime) {
          const diff = Math.max(
            0,
            Math.floor(
              (new Date(data.event.gameEndTime).getTime() - Date.now()) / 1000
            )
          );
          setRemainingSeconds(diff);
        }

        // Generate Door QR Code for Big Screen
        const joinUrl = `${window.location.origin}/e/${data.event.doorCodeToken}`;
        QRCode.toDataURL(joinUrl, {
          width: 260,
          margin: 1,
          color: { dark: "#000000", light: "#FFFFFF" },
        }).then(setQrDataUrl);
      }
    } catch (e) {
      console.error(e);
    }
  }, [eventId]);

  useEffect(() => {
    fetchLiveState();

    // SSE Realtime Subscription
    const sse = new EventSource(
      `/api/realtime/${encodeURIComponent(`event:${eventId}`)}`
    );

    sse.addEventListener("LEADERBOARD_UPDATE", () => fetchLiveState());
    sse.addEventListener("PLAYER_JOINED", () => fetchLiveState());
    sse.addEventListener("GAME_STATE_UPDATE", () => fetchLiveState());

    const interval = setInterval(fetchLiveState, 4000);
    const clockInterval = setInterval(() => {
      setRemainingSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      sse.close();
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [eventId, fetchLiveState]);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const isPaused = eventData?.status === "PAUSED";
  const isCompleted = eventData?.status === "COMPLETED";

  return (
    <main className="min-h-screen bg-[#070A10] text-white p-8 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Banner HUD */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 text-black flex items-center justify-center font-black shadow-xl shadow-cyan-500/40">
            <Zap className="w-9 h-9 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-white">
                {eventData?.name || "Nightlife Human Bingo"}
              </h1>
              <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-400 text-cyan-300 rounded-full text-xs font-black uppercase tracking-wider">
                LIVE ARENA
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-400 mt-0.5">
              📍 {eventData?.venueName || "Club Lounge"} • Prize:{" "}
              <strong className="text-amber-400">
                {eventData?.prizeDescription}
              </strong>
            </p>
          </div>
        </div>

        {/* Big Game Clock */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-[#121824] border-2 border-cyan-400/60 py-3 px-6 rounded-2xl shadow-xl shadow-cyan-500/20">
            <Clock className="w-7 h-7 text-cyan-400 animate-pulse" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                {isCompleted
                  ? "GAME FINISHED"
                  : isPaused
                  ? "GAME PAUSED"
                  : "TIME REMAINING"}
              </span>
              <span className="text-3xl font-mono font-black text-white">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid: Left is Big Leaderboard Podium, Right is Door QR & Live Ticker */}
      <div className="grid grid-cols-3 gap-8 my-auto py-6">
        {/* Left 2 Columns: Animated Leaderboard */}
        <div className="col-span-2 space-y-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>LIVE STANDINGS • TOP PLAYERS</span>
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {hudStats?.totalConnections || 0} TOTAL MEETS RECORDED
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-16 text-center bg-[#101622] rounded-3xl border border-slate-800">
              <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-3 animate-spin" />
              <h2 className="text-2xl font-black text-white">
                Waiting for the first connection!
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Scan the QR code on the right to join the game right now!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {leaderboard.slice(0, 6).map((p) => {
                const is1st = p.rank === 1;
                const is2nd = p.rank === 2;
                const is3rd = p.rank === 3;

                return (
                  <div
                    key={p.playerId}
                    className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                      is1st
                        ? "bg-gradient-to-r from-amber-500/20 via-[#151C2C] to-[#151C2C] border-2 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.01]"
                        : is2nd
                        ? "bg-gradient-to-r from-slate-400/15 to-[#151C2C] border-2 border-slate-400 shadow-lg"
                        : is3rd
                        ? "bg-gradient-to-r from-amber-800/20 to-[#151C2C] border-2 border-amber-600/70"
                        : "bg-[#121824] border border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg">
                        {is1st ? (
                          <span className="w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center font-black shadow-lg shadow-amber-400/40">
                            🥇 1
                          </span>
                        ) : is2nd ? (
                          <span className="w-10 h-10 rounded-full bg-slate-300 text-black flex items-center justify-center font-black shadow-md">
                            🥈 2
                          </span>
                        ) : is3rd ? (
                          <span className="w-10 h-10 rounded-full bg-amber-700 text-white flex items-center justify-center font-black">
                            🥉 3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">
                            #{p.rank}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-black text-white">
                            {p.displayName}
                          </span>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#0B0E14] text-cyan-300 rounded-md">
                            PIN: {p.shortCode}
                          </span>
                          {p.isCardCompleted && (
                            <span className="px-2 py-0.5 bg-amber-500/30 border border-amber-400 text-amber-300 text-xs font-black rounded-md flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-300" />
                              <span>BINGO!</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {p.distinctTraitsCount} distinct traits matched
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black text-cyan-400">
                        {p.connectionsCount}{" "}
                        <span className="text-sm font-bold text-slate-400">
                          Meets
                        </span>
                      </span>
                      <span className="text-xs text-slate-400 block">
                        {p.completedSquaresCount} squares filled
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Scan to Join QR + Live Ticker */}
        <div className="space-y-6 flex flex-col items-center">
          {/* Big Door QR Card */}
          <div className="w-full p-6 bg-[#151C2C] border-2 border-cyan-400 rounded-3xl shadow-2xl text-center flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest font-black text-cyan-400 mb-1">
              Scan from Your Seat
            </span>
            <h3 className="text-xl font-black text-white mb-4">
              Join the Bingo Game!
            </h3>

            <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-cyan-400 mb-4">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Join QR"
                  className="w-48 h-48 object-contain rounded-lg"
                />
              )}
            </div>

            <div className="text-xs font-semibold text-slate-300">
              Or open browser & type:
              <div className="mt-1 font-mono font-black text-lg text-cyan-300 bg-[#0B0E14] py-1 px-3 rounded-lg border border-slate-700">
                Code: {eventData?.doorCodeToken}
              </div>
            </div>
          </div>

          {/* Live Recent Handshakes Ticker */}
          <div className="w-full p-5 bg-[#121824] border border-slate-800 rounded-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Live Handshakes
              </h4>
            </div>

            <div className="space-y-2">
              {recentConnections.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 bg-[#0B0E14] border border-slate-800 rounded-xl flex items-center justify-between text-xs animate-fadeIn"
                >
                  <span className="font-bold text-white">
                    <span className="text-cyan-300">{c.playerA}</span> 🤝{" "}
                    <span className="text-purple-300">{c.playerB}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    JUST NOW
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Ticker */}
      <footer className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>⚡ Real-time updates active</span>
        <span className="font-mono text-cyan-400 font-bold">
          {hudStats?.totalPlayers || 0} ATTENDEES IN GAME
        </span>
      </footer>
    </main>
  );
}
