"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirectTo") || "/promoter";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"PASSWORD" | "MAGIC_LINK">("PASSWORD");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setOauthLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initialize Google Sign In");
      setOauthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === "PASSWORD") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        router.push(redirectTo);
        router.refresh();
      } else {
        // Magic Link Sign In
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          },
        });

        if (error) {
          setErrorMsg(error.message);
          return;
        }

        setMagicLinkSent(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#151C2C] border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30 mb-3">
          <Zap className="w-7 h-7 fill-white" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Mixx<span className="text-cyan-400">Social</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Host & Event Management Console
        </p>
      </div>

      {/* Google One-Click Login */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={oauthLoading || loading}
        className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 disabled:opacity-60 mb-5"
      >
        {oauthLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
        ) : (
          <GoogleIcon />
        )}
        <span>Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center mb-5">
        <div className="border-t border-slate-800 w-full" />
        <span className="bg-[#151C2C] px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
          Or with email
        </span>
        <div className="border-t border-slate-800 w-full" />
      </div>

      {/* Auth Mode Switcher */}
      <div className="flex p-1 bg-[#0B0E14] rounded-xl mb-5 border border-slate-800">
        <button
          type="button"
          onClick={() => {
            setMode("PASSWORD");
            setErrorMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mode === "PASSWORD"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("MAGIC_LINK");
            setErrorMsg(null);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mode === "MAGIC_LINK"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Magic Link
        </button>
      </div>

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-3.5 mb-5 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Magic Link Confirmation */}
      {magicLinkSent ? (
        <div className="p-5 bg-green-950/40 border border-green-500/40 rounded-2xl text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Check your inbox!</h3>
          <p className="text-xs text-slate-300">
            We sent an instant login link to{" "}
            <strong className="text-cyan-300">{email}</strong>.
          </p>
          <button
            onClick={() => setMagicLinkSent(false)}
            className="mt-3 text-xs text-cyan-400 font-bold hover:underline"
          >
            Sign in with password instead
          </button>
        </div>
      ) : (
        /* Login Form */
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase font-bold text-slate-300 mb-1.5">
              Work or Host Email
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

          {mode === "PASSWORD" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs uppercase font-bold text-slate-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full py-2.5 pl-10 pr-3.5 bg-[#0B0E14] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || oauthLoading}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 to-teal-300 hover:brightness-110 text-black font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-98 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>
                  {mode === "PASSWORD" ? "Sign In to Host Console" : "Send Magic Link"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Footer Links */}
      <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-2">
        <p className="text-xs text-slate-400">
          Don't have a host account?{" "}
          <Link
            href="/signup"
            className="text-cyan-400 font-bold hover:underline"
          >
            Create Account (1st Event Free)
          </Link>
        </p>

        <p className="text-[11px] text-slate-500">
          Are you an event guest?{" "}
          <Link href="/" className="text-slate-400 hover:text-white underline">
            Go to Guest Door Check-in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0B0E14] text-white flex flex-col justify-center items-center p-5 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <Suspense
        fallback={
          <div className="w-full max-w-md bg-[#151C2C] border border-slate-800 rounded-3xl p-8 shadow-2xl flex items-center justify-center min-h-[360px]">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
