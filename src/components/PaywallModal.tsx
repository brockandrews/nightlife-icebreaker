"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
  Crown,
} from "lucide-react";
import { PRICING_PACKS, PricingPack } from "@/lib/stripe";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export default function PaywallModal({
  isOpen,
  onClose,
  title = "Unlock More Live Events",
  subtitle = "You've used your free complimentary event. Choose a package to keep the games going!",
}: PaywallModalProps) {
  const [selectedPackId, setSelectedPackId] = useState<string>("bundle_3");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const packs = Object.values(PRICING_PACKS);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: selectedPackId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || "Failed to initiate Stripe checkout.");
      }

      // Redirect to Stripe Hosted Checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Failed to start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-[#0F1420] border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MixxSocial Host Passes</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-2">
            {subtitle}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Pricing Cards Selection */}
        <div className="space-y-3 mb-6">
          {packs.map((pack) => {
            const isSelected = selectedPackId === pack.id;
            return (
              <div
                key={pack.id}
                onClick={() => setSelectedPackId(pack.id)}
                className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? "bg-[#182338] border-cyan-400 shadow-lg shadow-cyan-500/10"
                    : "bg-[#141B2A] border-slate-800 hover:border-slate-700"
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-black text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-md">
                    <Crown className="w-3 h-3 fill-black" />
                    <span>Most Popular</span>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "border-cyan-400 bg-cyan-400"
                        : "border-slate-600 bg-transparent"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-black" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-black text-white">
                        {pack.name}
                      </span>
                      {pack.badge && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                          {pack.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {pack.description}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-lg sm:text-xl font-black text-white block leading-none">
                    ${(pack.priceCents / 100).toFixed(0)}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold">
                    {pack.unitPrice}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature List Summary */}
        <div className="bg-[#121826] border border-slate-800/80 rounded-2xl p-3.5 mb-6">
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
            Every Host Pass Includes:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Unlimited attendees</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Full venue leaderboard</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Export attendee data</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Sponsor placement slot</span>
            </div>
          </div>
        </div>

        {/* Checkout CTA */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 hover:from-cyan-300 hover:to-amber-200 text-black font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Opening Secure Stripe Checkout...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>
                Checkout with Stripe &bull; $
                {(
                  PRICING_PACKS[selectedPackId].priceCents / 100
                ).toFixed(0)}
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-500">
          <Lock className="w-3 h-3 text-slate-500" />
          <span>Encrypted 256-bit checkout powered by Stripe</span>
        </div>
      </div>
    </div>
  );
}
