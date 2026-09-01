"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/promoter/account`,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0E14] text-white flex flex-col justify-center items-center p-5 relative overflow-hidden">
      <div className="w-full max-w-md bg-[#151C2C] border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black mb-2">
            <Zap className="w-5 h-5 fill-cyan-400" />
          </div>
          <h1 className="text-xl font-black text-white">Reset Host Password</h1>
          <p className="text-xs text-slate-400 mt-1">
            Enter your email to receive a password reset link
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 mb-5 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {submitted ? (
          <div className="p-5 bg-green-950/40 border border-green-500/40 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Reset Link Sent!</h3>
            <p className="text-xs text-slate-300">
              Check <strong className="text-cyan-300">{email}</strong> for instructions to reset your password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-bold text-slate-300 mb-1.5">
                Host Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@venue-group.com"
                  required
                  className="w-full py-2.5 pl-10 pr-3.5 bg-[#0B0E14] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-400 to-teal-300 hover:brightness-110 text-black font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <span>Send Password Reset Link</span>
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
