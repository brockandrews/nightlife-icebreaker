"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Navigation,
  TabType,
} from "@/components/Navigation";
import { BingoCard, CardData } from "@/components/BingoCard";
import { QrCodeDisplay } from "@/components/QrCodeDisplay";
import { QrScannerModal } from "@/components/QrScannerModal";
import { LeaderboardView, LeaderboardEntry } from "@/components/LeaderboardView";
import { HandshakeRequestModal } from "@/components/HandshakeRequestModal";
import { MatchCelebrationModal } from "@/components/MatchCelebrationModal";
import { SquarePickerModal, CandidateSquare } from "@/components/SquarePickerModal";
import { BroadcastBanner } from "@/components/BroadcastBanner";
import { SafetyModal } from "@/components/SafetyModal";
import {
  Sparkles,
  ShieldAlert,
  Loader2,
  AlertCircle,
  Clock,
  Volume2,
} from "lucide-react";

export default function GuestGamePage() {
  const params = useParams();
  const router = useRouter();
  const code = (params?.code as string) || "PILOT-2026";

  // Player & Event Data
  const [player, setPlayer] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [card, setCard] = useState<CardData | null>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("card");
  const [loading, setLoading] = useState(true);

  // Real-time Handshake State
  const [activeHandshakeAttempt, setActiveHandshakeAttempt] = useState<{
    id: string;
    mode: "INCOMING" | "OUTGOING";
    partnerName: string;
    partnerShortCode?: string;
    expiresAt: string;
  } | null>(null);

  // Interactive 1-Person-1-Square Picker State
  const [pickerData, setPickerData] = useState<{
    partnerId: string;
    partnerName: string;
    candidateSquares: CandidateSquare[];
  } | null>(null);
  const [pickerLoading, setPickerLoading] = useState(false);

  // Match Celebration State
  const [celebrationData, setCelebrationData] = useState<{
    partnerName: string;
    matchedSquares: any[];
    completionMode: string;
  } | null>(null);

  // Scanner & Handshake Loading State
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Host Broadcast Announcement & Safety Modals
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  // Time remaining on game clock
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // SSE event source refs
  const playerSseRef = useRef<EventSource | null>(null);
  const eventSseRef = useRef<EventSource | null>(null);

  // 1. Initial Load of Player & Event
  const refreshPlayerData = useCallback(async (playerId: string) => {
    try {
      const res = await fetch(`/api/players/${playerId}`);
      const data = await res.json();
      if (data.success) {
        setPlayer(data.player);
        setEventData(data.event);
        setCard(data.card);
        setConnections(data.connections || []);

        if (data.pendingIncomingAttempt) {
          setActiveHandshakeAttempt({
            id: data.pendingIncomingAttempt.id,
            mode: "INCOMING",
            partnerName: data.pendingIncomingAttempt.initiator.displayName,
            partnerShortCode: data.pendingIncomingAttempt.initiator.shortCode,
            expiresAt: data.pendingIncomingAttempt.expiresAt,
          });
        }
      } else {
        localStorage.removeItem(`player_${code.toUpperCase()}`);
        router.replace(`/e/${code}`);
      }
    } catch (err) {
      console.error("Failed to refresh player:", err);
    }
  }, [code, router]);

  const refreshLeaderboard = useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/leaderboard/${eventId}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
        if (data.event?.gameEndTime) {
          const diff = Math.max(
            0,
            Math.floor(
              (new Date(data.event.gameEndTime).getTime() - Date.now()) / 1000
            )
          );
          setRemainingSeconds(diff);
        }
      }
    } catch (err) {
      console.error("Failed to refresh leaderboard:", err);
    }
  }, []);

  useEffect(() => {
    const rawPlayer = localStorage.getItem(`player_${code.toUpperCase()}`);
    if (!rawPlayer) {
      router.replace(`/e/${code}`);
      return;
    }

    try {
      const parsed = JSON.parse(rawPlayer);
      if (!parsed?.id) {
        router.replace(`/e/${code}`);
        return;
      }
      setPlayer(parsed);

      Promise.all([
        refreshPlayerData(parsed.id),
        refreshLeaderboard(parsed.eventId || code),
      ]).finally(() => setLoading(false));
    } catch (e) {
      router.replace(`/e/${code}`);
    }
  }, [code, refreshPlayerData, refreshLeaderboard, router]);

  // 2. Real-time Subscriptions via SSE
  useEffect(() => {
    if (!player?.id) return;

    // Connect to Player Private Channel
    const playerSse = new EventSource(
      `/api/realtime/${encodeURIComponent(`player:${player.id}`)}`
    );
    playerSseRef.current = playerSse;

    playerSse.addEventListener("HANDSHAKE_REQUEST", (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        setActiveHandshakeAttempt({
          id: payload.attemptId,
          mode: "INCOMING",
          partnerName: payload.initiator.displayName,
          partnerShortCode: payload.initiator.shortCode,
          expiresAt: payload.expiresAt,
        });
      } catch (err) {}
    });

    playerSse.addEventListener("HANDSHAKE_RESOLVED", (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        setActiveHandshakeAttempt(null);

        // Check if multiple squares match and selection is required!
        if (payload.requiresSelection && payload.candidateSquares?.length > 1) {
          setPickerData({
            partnerId: payload.partnerId,
            partnerName: payload.partnerName,
            candidateSquares: payload.candidateSquares,
          });
        } else if (payload.autoClaimedSquare) {
          // Exactly 1 square matched and was auto-claimed
          setCelebrationData({
            partnerName: payload.partnerName,
            matchedSquares: [payload.autoClaimedSquare],
            completionMode: payload.completionMode || "AUTO_FILL",
          });
        } else {
          // 0 matches (still recorded as a meet)
          setCelebrationData({
            partnerName: payload.partnerName,
            matchedSquares: [],
            completionMode: payload.completionMode || "AUTO_FILL",
          });
        }

        refreshPlayerData(player.id);
        if (player.eventId) refreshLeaderboard(player.eventId);
      } catch (err) {}
    });

    playerSse.addEventListener("HANDSHAKE_DISMISSED", (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        setActiveHandshakeAttempt(null);
        setScanError(payload.message || "Connection was declined");
      } catch (err) {}
    });

    playerSse.addEventListener("HANDSHAKE_EXPIRED", (e: any) => {
      try {
        const payload = JSON.parse(e.data);
        setActiveHandshakeAttempt(null);
        setScanError(payload.message || "Connection attempt timed out");
      } catch (err) {}
    });

    // Connect to Event Public Channel
    if (player.eventId) {
      const eventSse = new EventSource(
        `/api/realtime/${encodeURIComponent(`event:${player.eventId}`)}`
      );
      eventSseRef.current = eventSse;

      eventSse.addEventListener("LEADERBOARD_UPDATE", (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.leaderboard) setLeaderboard(payload.leaderboard);
        } catch (err) {}
      });

      eventSse.addEventListener("BROADCAST_ANNOUNCEMENT", (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          setBroadcastMessage(payload.message);
        } catch (err) {}
      });

      eventSse.addEventListener("GAME_STATE_UPDATE", (e: any) => {
        try {
          const payload = JSON.parse(e.data);
          setEventData((prev: any) => ({
            ...prev,
            status: payload.status,
            gameEndTime: payload.gameEndTime,
          }));
        } catch (err) {}
      });
    }

    // Polling fallback every 6 seconds
    const interval = setInterval(() => {
      if (player?.id) refreshPlayerData(player.id);
      if (player?.eventId) refreshLeaderboard(player.eventId);
    }, 6000);

    return () => {
      playerSse.close();
      if (eventSseRef.current) eventSseRef.current.close();
      clearInterval(interval);
    };
  }, [player?.id, player?.eventId, refreshPlayerData, refreshLeaderboard]);

  // 3. Initiate Handshake Connection (Scan or PIN)
  const handleScanTarget = async (targetCode: string) => {
    if (!player?.id) return;
    setScanLoading(true);
    setScanError(null);

    try {
      const res = await fetch("/api/handshake/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initiatorId: player.id,
          targetCode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Switch to waiting state
        setActiveHandshakeAttempt({
          id: data.attemptId,
          mode: "OUTGOING",
          partnerName: data.targetName,
          partnerShortCode: data.targetShortCode,
          expiresAt: data.expiresAt,
        });
      } else {
        setScanError(data.error || "Failed to initiate connection");
      }
    } catch (err: any) {
      setScanError(err.message || "Network error. Please retry.");
    } finally {
      setScanLoading(false);
    }
  };

  // 4. Confirm Handshake as Target Player B
  const handleConfirmHandshake = async () => {
    if (!activeHandshakeAttempt?.id) return;
    setScanLoading(true);
    try {
      const res = await fetch(
        `/api/handshake/${activeHandshakeAttempt.id}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "CONFIRM" }),
        }
      );
      const data = await res.json();
      if (data.success) {
        const pName = activeHandshakeAttempt.partnerName;
        const pId = data.partnerId;
        setActiveHandshakeAttempt(null);

        // Check if multiple squares match and selection is required!
        if (data.requiresSelection && data.candidateSquares?.length > 1) {
          setPickerData({
            partnerId: pId,
            partnerName: pName,
            candidateSquares: data.candidateSquares,
          });
        } else if (data.autoClaimedSquare) {
          setCelebrationData({
            partnerName: pName,
            matchedSquares: [data.autoClaimedSquare],
            completionMode: data.completionMode || "AUTO_FILL",
          });
        } else {
          setCelebrationData({
            partnerName: pName,
            matchedSquares: [],
            completionMode: data.completionMode || "AUTO_FILL",
          });
        }

        if (player?.id) refreshPlayerData(player.id);
        if (player?.eventId) refreshLeaderboard(player.eventId);
      } else {
        setScanError(data.error || "Failed to confirm");
      }
    } catch (err: any) {
      setScanError(err.message || "Failed to confirm");
    } finally {
      setScanLoading(false);
    }
  };

  // 5. Dismiss Handshake
  const handleDismissHandshake = async () => {
    if (!activeHandshakeAttempt?.id) {
      setActiveHandshakeAttempt(null);
      return;
    }
    try {
      await fetch(`/api/handshake/${activeHandshakeAttempt.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DISMISS" }),
      });
    } catch (e) {}
    setActiveHandshakeAttempt(null);
  };

  // 6. Handle User Selecting Their 1 Square from Multiple Candidates
  const handleClaimSquare = async (sq: CandidateSquare) => {
    if (!player?.id || !pickerData) return;
    setPickerLoading(true);
    try {
      const res = await fetch("/api/cards/claim-square", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.id,
          squareId: sq.id,
          matchedPlayerId: pickerData.partnerId,
          matchedPlayerName: pickerData.partnerName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const pName = pickerData.partnerName;
        setPickerData(null);
        setCelebrationData({
          partnerName: pName,
          matchedSquares: [data.square],
          completionMode: eventData?.completionMode || "AUTO_FILL",
        });
        refreshPlayerData(player.id);
        if (player.eventId) refreshLeaderboard(player.eventId);
      } else {
        setScanError(data.error || "Failed to claim square");
      }
    } catch (e: any) {
      setScanError(e.message || "Failed to claim square");
    } finally {
      setPickerLoading(false);
    }
  };

  if (loading || !player) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-5 text-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
        <h2 className="text-xl font-bold text-white">Loading Game...</h2>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col justify-between p-4 max-w-lg mx-auto pb-28">
      {/* Top Host Broadcast Banner */}
      <BroadcastBanner
        message={broadcastMessage}
        onDismiss={() => setBroadcastMessage(null)}
      />

      {/* Top Header Bar */}
      <header className="w-full flex items-center justify-between pt-1 pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-400 text-black flex items-center justify-center font-black shadow-md shadow-cyan-400/30">
            {player.displayName?.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-white">
                {player.displayName}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 rounded text-cyan-300 font-bold">
                {player.shortCode}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block leading-tight">
              {eventData?.name || "Nightlife Mixer"}
            </span>
          </div>
        </div>

        {/* Top Right: Safety Flag */}
        <button
          onClick={() => setIsSafetyOpen(true)}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-all border border-slate-700/60"
          title="Safety & Report"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>
      </header>

      {/* Main Tab Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {activeTab === "card" && (
          <div className="w-full animate-fadeIn">
            <BingoCard
              card={card}
              cardSize={eventData?.cardSize || "5x5"}
            />
          </div>
        )}

        {activeTab === "my-id" && (
          <div className="w-full animate-fadeIn">
            <QrCodeDisplay
              player={player}
              venueName={eventData?.venueName}
            />
          </div>
        )}

        {activeTab === "scan" && (
          <div className="w-full animate-fadeIn">
            <QrScannerModal
              onScanTarget={handleScanTarget}
              isLoading={scanLoading}
              errorMessage={scanError}
              clearError={() => setScanError(null)}
            />
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="w-full animate-fadeIn">
            <LeaderboardView
              entries={leaderboard}
              currentPlayerId={player.id}
              scoringModel={eventData?.scoringModel}
              prizeDescription={eventData?.prizeDescription}
              timeRemainingSeconds={remainingSeconds}
            />
          </div>
        )}
      </div>

      {/* Real-time Handshake Modal */}
      {activeHandshakeAttempt && (
        <HandshakeRequestModal
          mode={activeHandshakeAttempt.mode}
          partnerName={activeHandshakeAttempt.partnerName}
          partnerShortCode={activeHandshakeAttempt.partnerShortCode}
          expiresAt={activeHandshakeAttempt.expiresAt}
          onConfirm={handleConfirmHandshake}
          onDismiss={handleDismissHandshake}
          isLoading={scanLoading}
        />
      )}

      {/* Interactive 1-Person-1-Square Selection Modal */}
      {pickerData && (
        <SquarePickerModal
          partnerId={pickerData.partnerId}
          partnerName={pickerData.partnerName}
          candidateSquares={pickerData.candidateSquares}
          cardSize={eventData?.cardSize || "5x5"}
          onSelectSquare={handleClaimSquare}
          isLoading={pickerLoading}
        />
      )}

      {/* Verified Match Celebration Modal */}
      {celebrationData && (
        <MatchCelebrationModal
          partnerName={celebrationData.partnerName}
          matchedSquares={celebrationData.matchedSquares}
          completionMode={celebrationData.completionMode}
          onClose={() => setCelebrationData(null)}
        />
      )}

      {/* Safety & Report Modal */}
      <SafetyModal
        currentUserId={player.id}
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
        connectionsList={connections}
      />

      {/* Fixed Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectionsCount={connections.length}
        hasPendingHandshake={Boolean(
          activeHandshakeAttempt && activeHandshakeAttempt.mode === "INCOMING"
        )}
      />
    </main>
  );
}
