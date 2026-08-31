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
  BarChart,
  ShieldCheck,
} from "lucide-react";

export default function PostEventReportPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = (params?.eventId as string) || "PILOT-2026";

  const [eventData, setEventData] = useState<any>(null);
  const [hudStats, setHudStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/leaderboard/${eventId}`);
        const data = await res.json();
        if (data.success) {
          setEventData(data.event);
          setHudStats(data.hud);
          setLeaderboard(data.leaderboard || []);
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

  const handleDownloadCsv = () => {
    if (!eventData?.id) return;
    window.location.href = `/api/promoter/export/${eventData.id}`;
  };

  if (loading || !eventData) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-5 text-center text-white">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm font-semibold">Generating Post-Event Report...</p>
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

  return (
    <main className="min-h-screen p-5 max-w-4xl mx-auto text-white">
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
            </div>
            <h1 className="text-2xl font-black text-white leading-tight">
              {eventData.name} — Report
            </h1>
            <p className="text-xs text-slate-400">📍 {eventData.venueName}</p>
          </div>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="py-3 px-5 bg-gradient-to-r from-green-400 to-emerald-500 hover:brightness-110 text-black font-extrabold rounded-2xl text-xs flex items-center gap-2 shadow-xl shadow-green-900/30 active:scale-95 transition-all"
        >
          <Download className="w-4 h-4 stroke-[3]" />
          <span>Export Consented Leads (CSV)</span>
        </button>
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
            Verified by 60s mutual handshake
          </p>
        </div>
      </div>

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
