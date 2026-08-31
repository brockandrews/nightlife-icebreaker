"use client";

import React, { useState } from "react";
import { ShieldAlert, X, AlertTriangle, Check, Loader2 } from "lucide-react";

interface SafetyModalProps {
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  connectionsList?: { connectedWith: string; shortCode: string; id: string }[];
}

export function SafetyModal({
  currentUserId,
  isOpen,
  onClose,
  connectionsList = [],
}: SafetyModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      await fetch("/api/safety/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterId: currentUserId,
          reportedId: selectedPlayer || "UNKNOWN",
          reason,
        }),
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#151C2C] border border-red-500/40 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3 text-red-400">
          <ShieldAlert className="w-6 h-6" />
          <h3 className="text-lg font-black text-white">Safety & Moderation</h3>
        </div>

        {submitted ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-400 mx-auto flex items-center justify-center mb-2">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="text-base font-bold text-white">Report Received</h4>
            <p className="text-xs text-slate-300 mt-1 mb-4">
              Thank you. The event hosts have been alerted, and this person is blocked from connecting with you.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="w-full py-2.5 bg-slate-800 text-white font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-xs text-slate-300">
              We want everyone to have a safe, fun, and platonic experience. Reports are sent directly to the event host.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Select Person (or enter details)
              </label>
              <input
                type="text"
                value={selectedPlayer}
                onChange={(e) => setSelectedPlayer(e.target.value)}
                placeholder="Name or 4-letter PIN"
                className="w-full py-2 px-3 bg-[#0B0E14] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Reason for report
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Harassment, inappropriate behavior, etc."
                required
                className="w-full py-2 px-3 bg-[#0B0E14] border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span>Submit Confidential Report</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
