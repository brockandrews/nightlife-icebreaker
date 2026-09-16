"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Trophy,
  Users,
  Download,
  CheckCircle,
  Sparkles,
  ArrowLeft,
  Loader2,
  PieChart,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Lock,
} from "lucide-react";

export default function PostEventReportPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = (params?.eventId as string) || "PILOT-2026";

  const [eventData, setEventData] = useState<any>(null);
  const [hudStats, setHudStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [hostRole, setHostRole] = useState<string>("OWNER");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [leaderboardRes, analyticsRes, authRes] = await Promise.all([
          fetch(`/api/leaderboard/${eventId}`),
          fetch(`/api/events/${eventId}/analytics`),
          fetch("/api/auth/me"),
        ]);

        const leaderboardData = await leaderboardRes.json();
        if (leaderboardData.success) {
          setEventData(leaderboardData.event);
          setHudStats(leaderboardData.hud);
          setLeaderboard(leaderboardData.leaderboard || []);
        }

        const analyticsJson = await analyticsRes.json();
        if (analyticsJson.success) {
          setAnalyticsData(analyticsJson);
        }

        const authJson = await authRes.json();
        if (authJson.success && authJson.host) {
          setHostRole(authJson.host.role || "OWNER");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId]);

  const winner = leaderboard.length > 0 ? leaderboard[0] : null;

  const handleDownloadLeadsCsv = () => {
    if (!eventData?.id) return;
    window.location.href = `/api/promoter/export/${eventData.id}?type=leads`;
  };

  const handleDownloadAuditCsv = () => {
    if (!eventData?.id) return;
    window.location.href = `/api/promoter/export/${eventData.id}?type=audit`;
  };

  if (loading || !eventData) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-5 text-center text-white">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Generating Post-Event Report & Intelligence...</p>
      </main>
    );
  }

  // Compute conversion funnel rates
  const totalScans = hudStats?.totalPlayers || 0;
  const surveysCompleted = hudStats?.totalSurveysCompleted || 0;
  const activePlayers = hudStats?.activePlayersCount || 0;
  const surveyConversionRate =
    totalScans > 0 ? Math.round((surveysCompleted / totalScans) * 100) : 0;
  const activationRate =
    surveysCompleted > 0
      ? Math.round((activePlayers / surveysCompleted) * 100)
      : 0;

  const isDoorStaff = hostRole === "DOOR_STAFF";
  const benchmarks = analyticsData?.historicalBenchmarks;
  const questionStats = analyticsData?.questionStats || [];

  return (
    <main className="min-h-screen p-5 max-w-5xl mx-auto text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/promoter/${eventData.id}`)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Post-Event Intelligence
              </span>
              {hostRole && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Role: {hostRole}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-white leading-tight mt-1">
              {eventData.name} — Report & Audit
            </h1>
            <p className="text-xs text-slate-400">📍 {eventData.venueName}</p>
          </div>
        </div>

        {/* CSV Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Winner Audit Trail CSV (Available to All Staff) */}
          <button
            onClick={handleDownloadAuditCsv}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-extrabold rounded-2xl text-xs flex items-center gap-2 border border-slate-700 active:scale-95 transition-all shadow-md"
            title="Download full mutual PIN verification and winner timestamp audit for legal compliance"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Export Winner Audit Trail</span>
          </button>

          {/* Consented Leads CSV (Restricted from Door Staff) */}
          {!isDoorStaff ? (
            <button
              onClick={handleDownloadLeadsCsv}
              className="py-2.5 px-5 bg-gradient-to-r from-green-400 to-emerald-500 hover:brightness-110 text-black font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-xl shadow-green-900/30 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 stroke-[3]" />
              <span>Export Consented Leads</span>
            </button>
          ) : (
            <div className="py-2.5 px-4 bg-slate-900/80 border border-slate-800 text-slate-500 rounded-2xl text-xs font-semibold flex items-center gap-2 cursor-not-allowed">
              <Lock className="w-3.5 h-3.5" />
              <span>Leads CSV (Manager+ Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* Verified Winner Audit Box (PRD §5.8 & §9.2 Compliance) */}
      {winner ? (
        <div className="p-6 bg-gradient-to-r from-amber-500/20 via-purple-900/30 to-[#151C2C] border-2 border-amber-400 rounded-3xl mb-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-400/40">
                👑
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                  Official Verified Winner
                </span>
                <h2 className="text-2xl font-black text-white">
                  {winner.displayName}
                </h2>
                <p className="text-xs text-slate-300">
                  PIN: <span className="font-mono font-bold text-cyan-300">{winner.shortCode}</span> •{" "}
                  {winner.connectionsCount} Verified Meets •{" "}
                  {winner.distinctTraitsCount} Unique Traits
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#0B0E14]/80 border border-slate-800 rounded-2xl text-right">
              <span className="text-[10px] text-slate-400 block">
                Prize to Award:
              </span>
              <span className="text-xs font-bold text-amber-300">
                {eventData.prizeDescription}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-[#151C2C] rounded-2xl border border-slate-800 text-center mb-6 text-slate-400 text-xs">
          No winner recorded yet.
        </div>
      )}

      {/* Engagement & Funnel Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Door → Survey Funnel
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400">
              {surveyConversionRate}%
            </span>
            <span className="text-xs text-slate-400">
              ({surveysCompleted} of {totalScans} scans)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-cyan-400 h-2 rounded-full"
              style={{ width: `${surveyConversionRate}%` }}
            />
          </div>
        </div>

        <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Survey → Activation Rate
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-400">
              {activationRate}%
            </span>
            <span className="text-xs text-slate-400">
              ({activePlayers} active players)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-purple-400 h-2 rounded-full"
              style={{ width: `${activationRate}%` }}
            />
          </div>
        </div>

        <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total In-Person Connections
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">
              {hudStats?.totalConnections || 0}
            </span>
            <span className="text-xs text-slate-400">
              (Median: {hudStats?.medianConnections || 0}/player)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Verified by mutual 4-digit PIN handshake
          </p>
        </div>
      </div>

      {/* Historical Benchmarks (Host Cross-Event Intelligence) */}
      {benchmarks && (
        <div className="p-6 bg-gradient-to-r from-[#151C2C] to-[#1a2336] border border-slate-800 rounded-3xl mb-6 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-black text-white">
              Historical Benchmarks Across Your Events
            </h3>
            <span className="text-xs text-slate-400">
              (Based on {benchmarks.totalHostEvents} game{benchmarks.totalHostEvents === 1 ? "" : "s"} hosted)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-[#0B0E14]/60 border border-slate-800/80 rounded-2xl">
              <span className="text-xs text-slate-400 block mb-1 font-semibold">
                Event Attendance vs Average
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">
                  {benchmarks.currentEventAttendees}
                </span>
                <span className="text-xs text-slate-400">
                  (Avg: {benchmarks.avgAttendeesPerEvent})
                </span>
              </div>
              <div className="mt-2 text-xs font-bold">
                {benchmarks.attendanceComparisonPercent >= 0 ? (
                  <span className="text-emerald-400">
                    +{benchmarks.attendanceComparisonPercent}% above your host average
                  </span>
                ) : (
                  <span className="text-amber-400">
                    {benchmarks.attendanceComparisonPercent}% below your host average
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#0B0E14]/60 border border-slate-800/80 rounded-2xl">
              <span className="text-xs text-slate-400 block mb-1 font-semibold">
                Connections Per Player
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-cyan-400">
                  {benchmarks.currentConnectionsPerPlayer}
                </span>
                <span className="text-xs text-slate-400">
                  (Avg: {benchmarks.avgConnectionsPerPlayer})
                </span>
              </div>
              <div className="mt-2 text-xs font-bold">
                {benchmarks.connectionComparisonPercent >= 0 ? (
                  <span className="text-emerald-400">
                    +{benchmarks.connectionComparisonPercent}% social engagement pace
                  </span>
                ) : (
                  <span className="text-amber-400">
                    {benchmarks.connectionComparisonPercent}% social engagement pace
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 bg-[#0B0E14]/60 border border-slate-800/80 rounded-2xl">
              <span className="text-xs text-slate-400 block mb-1 font-semibold">
                Total Meets Facilitated
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-300">
                  {benchmarks.currentEventConnections}
                </span>
                <span className="text-xs text-slate-400">
                  (All games: {benchmarks.avgConnectionsPerEvent * benchmarks.totalHostEvents})
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                100% verified via bilateral PIN exchange
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-Question Response Distribution (PRD §6.4 Intelligence) */}
      {questionStats.length > 0 && (
        <div className="p-6 bg-[#151C2C] border border-slate-800 rounded-3xl mb-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-black text-white">
                Icebreaker Question Response Distribution
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {questionStats.length} Questions Analyzed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {questionStats.map((q: any) => (
              <div
                key={q.id}
                className="p-4 bg-[#0B0E14]/60 border border-slate-800 rounded-2xl space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-black text-white leading-snug">
                    {q.prompt}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shrink-0">
                    {q.category}
                  </span>
                </div>

                <div className="space-y-2">
                  {q.options.map((opt: any, optIdx: number) => {
                    const isTop = q.topOption && q.topOption.option === opt.option;
                    return (
                      <div key={optIdx} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={isTop ? "font-bold text-amber-300" : "text-slate-300"}>
                            {opt.option} {isTop && "👑"}
                          </span>
                          <span className="font-mono text-slate-400">
                            {opt.percentage}% ({opt.count})
                          </span>
                        </div>
                        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              isTop ? "bg-amber-400" : "bg-cyan-500"
                            }`}
                            style={{ width: `${opt.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 flex justify-between">
                  <span>{q.totalResponses} responses recorded</span>
                  {q.topOption && (
                    <span className="text-amber-400 font-bold">
                      Top: {q.topOption.option} ({q.topOption.percentage}%)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Audit Table */}
      <div className="p-5 bg-[#151C2C] border border-slate-800 rounded-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-white">
              Full Standings Audit Trail
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {leaderboard.length} Total Players
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                <th className="pb-3 px-2">Rank</th>
                <th className="pb-3 px-2">Player</th>
                <th className="pb-3 px-2">PIN</th>
                <th className="pb-3 px-2 text-right">Verified Meets</th>
                <th className="pb-3 px-2 text-right">Squares Filled</th>
                <th className="pb-3 px-2 text-right">Unique Traits</th>
                <th className="pb-3 px-2 text-right">Bingo Win</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leaderboard.map((p) => (
                <tr key={p.playerId} className="hover:bg-slate-800/40">
                  <td className="py-3 px-2 font-mono font-bold text-slate-400">
                    #{p.rank}
                  </td>
                  <td className="py-3 px-2 font-bold text-white">
                    {p.displayName}
                  </td>
                  <td className="py-3 px-2 font-mono text-cyan-300">
                    {p.shortCode}
                  </td>
                  <td className="py-3 px-2 text-right font-black text-cyan-400">
                    {p.connectionsCount}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-300">
                    {p.completedSquaresCount}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-300">
                    {p.distinctTraitsCount}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {p.isCardCompleted ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                        YES
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
