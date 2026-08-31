"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  ChevronRight,
} from "lucide-react";

export default function PromoterDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const res = await fetch("/api/events");
        const data = await res.json();
        if (data.success && data.events) {
          setEvents(data.events);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const totalAttendees = events.reduce(
    (sum, e) => sum + (e._count?.players || 0),
    0
  );
  const totalConnections = events.reduce(
    (sum, e) => sum + (e._count?.connections || 0),
    0
  );

  return (
    <main className="min-h-screen p-5 max-w-4xl mx-auto text-white">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">
              Promoter Console
            </h1>
            <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">
              Nightlife Icebreaker Operations
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold"
          >
            Guest View
          </a>
          <button
            onClick={() => router.push("/promoter/new")}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-300 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Event</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metrics HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
        <div className="p-4 bg-[#151C2C] border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Total Events</span>
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
        <h2 className="text-base font-black text-white uppercase tracking-wider">
          Your Events
        </h2>

        {loading ? (
          <div className="p-12 text-center bg-[#121824] rounded-2xl border border-slate-800">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-400">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center bg-[#121824] rounded-2xl border border-slate-800">
            <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white mb-1">No Events Found</h3>
            <p className="text-xs text-slate-400 mb-4">
              Create your first nightlife icebreaker event to get started!
            </p>
            <button
              onClick={() => router.push("/promoter/new")}
              className="py-2.5 px-5 bg-cyan-400 text-black font-extrabold rounded-xl text-xs"
            >
              Create Event
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
