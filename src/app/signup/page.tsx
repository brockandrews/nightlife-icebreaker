"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Mail,
  Lock,
  User,
  Building,
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Gift,
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

export default function SignupPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const supabase = createClient();

  const handleGoogleSignUp = async () => {
    setOauthLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/promoter`,
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
      setErrorMsg(err.message || "Failed to initialize Google Sign Up");
      setOauthLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            displayName: displayName.trim(),
            organization: organization.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/promoter`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      // If Supabase auto-confirmed or returned session immediately:
      if (data.session) {
        router.push("/promoter");
        router.refresh();
      } else {
        // Email confirmation is required by Supabase auth config
        setConfirmationSent(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0E14] text-white flex flex-col justify-center items-center p-5 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#151C2C] border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30 mb-2">
            <Zap className="w-7 h-7 fill-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Create Host Account
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Launch interactive icebreaker games for your events
          </p>
        </div>

        {/* Free First Event Promo Callout */}
        <div className="p-3 bg-gradient-to-r from-purple-950/80 to-cyan-950/60 border border-purple-500/40 rounded-2xl mb-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-black text-white block">
              1st Event Free Promo Included
            </span>
            <span className="text-[11px] text-purple-200">
              No credit card required to build and run your first mixer.
            </span>
          </div>
        </div>

        {/* Google One-Click Sign Up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={oauthLoading || loading}
          className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 disabled:opacity-60 mb-5"
        >
          {oauthLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
          ) : (
            <GoogleIcon />
          )}
          <span>Sign up with Google</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-[#151C2C] px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
            Or register with email
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 mb-5 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {confirmationSent ? (
          <div className="p-5 bg-green-950/40 border border-green-500/40 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Confirmation Link Sent!</h3>
            <p className="text-xs text-slate-300">
              Please click the link sent to{" "}
              <strong className="text-cyan-300">{email}</strong> to activate your
              host account.
            </p>
            <Link
              href="/login"
              className="inline-block mt-3 text-xs text-cyan-400 font-bold hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3.5">
            <div>
              <label className="block text-xs uppercase font-bold text-slate-300 mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Brock Andrews"
                  required
                  className="w-full py-2.5 pl-10 pr-3.5 bg-[#0B0E14] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-300 mb-1">
                Organization / Venue / Company Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Velocity Lounge & Mixers"
                  required
                  className="w-full py-2.5 pl-10 pr-3.5 bg-[#0B0E14] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-300 mb-1">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="brock@velocity.com"
                  required
                  className="w-full py-2.5 pl-10 pr-3.5 bg-[#0B0E14] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase font-bold text-slate-300 mb-1">
                Create Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full py-2.5 pl-10 pr-3.5 bg-[#0B0E14] border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || oauthLoading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:brightness-110 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/30 active:scale-98 disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Start Free Event</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400">
            Already have a host account?{" "}
            <Link href="/login" className="text-cyan-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
