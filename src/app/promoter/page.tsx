"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Trophy,
  Zap,
  Plus,
  Play,
  Monitor,
  FileSpreadsheet,
  QrCode,
  Calendar,
  Sparkles,
  Loader2,
  LogOut,
  Building,
  User,
  Gift,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function HostDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [hostInfo, setHostInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [eventsRes, hostRes] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/auth/me"),
        ]);

        const eventsData = await eventsRes.json();
        if (eventsData.success && eventsData.events) {
          setEvents(eventsData.events);
        }

        const hostData = await hostRes.json();
        if (hostData.success && hostData.host) {
          setHostInfo(hostData.host);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setSigningOut(false);
    }
  };

  const totalAttendees = events.reduce(
    (sum, e) => sum + (e._count?.players || 0),
    0
  );
  const totalConnections = events.reduce(
    (sum, e) => sum + (e._count?.connections || 0),
    0
  );

  return (
    <main className="min-h-screen p-5 max-w-5xl mx-auto text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white leading-tight">
                Mixx<span className="text-cyan-400">Social</span>
              </h1>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Host Console
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {hostInfo?.organization ? (
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-cyan-400" />
                  <strong className="text-slate-300">
                    {hostInfo.organization}
                  </strong>{" "}
                  • {hostInfo.displayName}
                </span>
              ) : (
                "Event Icebreaker Platform"
              )}
            </p>
          </div>
        </div>

        {/* Action Controls & User Profile */}
        <div className="flex flex-wrap items-center gap-2">
          {hostInfo?.freeEventsRemaining > 0 && (
            <div className="py-1.5 px-3 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Gift className="w-3.5 h-3.5 text-pink-400" />
              <span>{hostInfo.freeEventsRemaining} Free Event Left</span>
            </div>
          )}

          <a
            href="/"
            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold"
          >
            Guest Door
          </a>

          <button
            onClick={() => router.push("/promoter/new")}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign Out"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 transition-all"
          >
            {signingOut ? (
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Aggregate Metrics HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
        <div className="p-4 bg-[#151C2C] border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Your Hosted Events</span>
          </div>
          <span className="text-2xl font-black text-white">{events.length}</span>
        </div>

        <div className="p-4 bg-[#151C2C] border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
            <Users className="w-4 h-4 text-purple-400" />
            <span>Total Attendees Checked In</span>
          </div>
          <span className="text-2xl font-black text-purple-300">
            {totalAttendees}
          </span>
        </div>

        <div className="p-4 bg-[#151C2C] border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Verified Meets / Handshakes</span>
          </div>
          <span className="text-2xl font-black text-amber-300">
            {totalConnections}
          </span>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white uppercase tracking-wider">
            Your Events
          </h2>
          <span className="text-xs text-slate-400">
            {events.length} {events.length === 1 ? "event" : "events"} managed
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-[#121824] rounded-2xl border border-slate-800">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">
              Loading your events...
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center bg-[#121824] rounded-2xl border border-slate-800">
            <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white mb-1">
              No Events Created Yet
            </h3>
            <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
              Launch your first icebreaker mixer in under 2 minutes. Your first event is 100% free!
            </p>
            <button
              onClick={() => router.push("/promoter/new")}
              className="py-2.5 px-5 bg-cyan-400 text-black font-extrabold rounded-xl text-xs shadow-lg shadow-cyan-500/20"
            >
              Create Free Event
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((evt) => {
              const isActive = evt.status === "ACTIVE";
              return (
                <div
                  key={evt.id}
                  className="p-5 bg-[#151C2C] border border-slate-800 rounded-2xl hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isActive
                            ? "bg-green-500/20 text-green-400 border border-green-500/40 animate-pulse"
                            : evt.status === "PAUSED"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {evt.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        Door Code: {evt.doorCodeToken}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-white leading-tight">
                      {evt.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      📍 {evt.venueName} • {evt._count?.players || 0} Players •{" "}
                      {evt._count?.connections || 0} Connections
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => router.push(`/promoter/${evt.id}`)}
                      className="py-2 px-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-900/30"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Live Console</span>
                    </button>

                    <button
                      onClick={() => router.push(`/promoter/${evt.id}/projector`)}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
                    >
                      <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Projector View</span>
                    </button>

                    <button
                      onClick={() => router.push(`/promoter/${evt.id}/qr`)}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
                    >
                      <QrCode className="w-3.5 h-3.5 text-purple-400" />
                      <span>Print QR</span>
                    </button>

                    <button
                      onClick={() => router.push(`/promoter/${evt.id}/report`)}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" />
                      <span>Report / Leads</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
