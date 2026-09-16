"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Users,
  UserPlus,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building,
} from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  displayName: string;
  role: "OWNER" | "MANAGER" | "DOOR_STAFF";
  userId: string | null;
  createdAt: string;
}

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationName?: string;
  currentUserRole?: string;
  isOwner?: boolean;
}

export default function TeamManagementModal({
  isOpen,
  onClose,
  organizationName = "Your Organization",
  currentUserRole = "OWNER",
  isOwner = true,
}: TeamManagementModalProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New member form state
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"MANAGER" | "DOOR_STAFF">("DOOR_STAFF");

  const canManage = isOwner || currentUserRole === "MANAGER";

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/host/team");
      const data = await res.json();
      if (data.success && data.teamMembers) {
        setTeamMembers(data.teamMembers);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTeam();
    }
  }, [isOpen]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !displayName) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/host/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to add team member.");
      }

      setSuccess(`Added ${displayName} as ${role === "MANAGER" ? "Manager" : "Door Staff"}!`);
      setEmail("");
      setDisplayName("");
      setRole("DOOR_STAFF");
      fetchTeam();
    } catch (err: any) {
      setError(err.message || "Failed to add member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      setDeletingId(memberId);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/host/team?memberId=${memberId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove team member.");
      }

      setSuccess("Team member removed.");
      fetchTeam();
    } catch (err: any) {
      setError(err.message || "Failed to remove team member.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#0F1420] border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Role-Based Access Control</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Team & Staff Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage access for {organizationName}. Invite staff to run door check-ins or event managers to duplicate and create games.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        <div className="overflow-y-auto space-y-6 pr-1 flex-1">
          {/* Add Team Member Form (Owner & Manager only) */}
          {canManage && (
            <div className="p-4 bg-[#141B2A] border border-slate-800 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Invite New Staff or Manager
                </h3>
              </div>

              <form onSubmit={handleAddMember} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full bg-[#0B0E14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@venue.com"
                      className="w-full bg-[#0B0E14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">
                      Role
                    </label>
                    <select
                      value={role}
                      onChange={(e: any) => setRole(e.target.value)}
                      className="w-full bg-[#0B0E14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="DOOR_STAFF">Door Staff (Door / Live / TV)</option>
                      <option value="MANAGER">Manager (Create / Reports / Leads)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={submitting || !email || !displayName}
                    className="py-2 px-4 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    <span>Add Member</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Current Team Members List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Current Team Members
              </h3>
              <span className="text-[11px] text-slate-400">
                {teamMembers.length + 1} Total Accounts
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-[#121824] rounded-2xl border border-slate-800">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading team roster...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Organization Owner Entry (Always top) */}
                <div className="p-3 bg-[#151C2C] border border-amber-500/40 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold text-sm">
                      👑
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          Account Owner
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/50">
                          OWNER
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Primary Billing & Administrative Authority
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-300/80 font-bold bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-500/30">
                    Full Rights & Access
                  </span>
                </div>

                {/* Additional Team Members */}
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 bg-[#121824] border border-slate-800 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          member.role === "MANAGER"
                            ? "bg-purple-950/80 border border-purple-500/40 text-purple-300"
                            : "bg-cyan-950/80 border border-cyan-500/40 text-cyan-300"
                        }`}
                      >
                        {member.role === "MANAGER" ? "MGR" : "STAFF"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {member.displayName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              member.role === "MANAGER"
                                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                                : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            }`}
                          >
                            {member.role === "MANAGER" ? "MANAGER" : "DOOR STAFF"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Delete button (Owner can delete anyone; Manager can only delete Door Staff) */}
                      {(isOwner || (currentUserRole === "MANAGER" && member.role === "DOOR_STAFF")) && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={deletingId === member.id}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-500/30 transition-all active:scale-95 disabled:opacity-50"
                          title="Remove team member"
                        >
                          {deletingId === member.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Permissions Reference Guide */}
          <div className="p-4 bg-[#0B0E14]/80 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Role Permission Summary (PRD §6.1)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-[#141B2A] border border-amber-500/30">
                <span className="font-bold text-amber-300 block mb-1">👑 OWNER</span>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  100% full rights: Billing, pass purchases, team roster, event creation, 1-click cloning, leads CSV & audit exports.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#141B2A] border border-purple-500/30">
                <span className="font-bold text-purple-300 block mb-1">🛡️ MANAGER</span>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  Operational authority: Create & duplicate events, live console, projector, post-event reports, and consented leads CSV.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[#141B2A] border border-cyan-500/30">
                <span className="font-bold text-cyan-300 block mb-1">🎫 DOOR STAFF</span>
                <p className="text-slate-400 text-[10px] leading-relaxed">
                  On-site execution: Live console, guest lookup, projector, print QR, winner audit log. Cannot access billing or leads CSV.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
