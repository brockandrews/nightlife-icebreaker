"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function doLogout() {
      try {
        await supabase.auth.signOut();
        // Also ping the server signout route to ensure cookies are purged
        await fetch("/api/auth/signout", { method: "POST" });
      } catch (e) {
        console.error("Logout error:", e);
      } finally {
        window.location.href = "/login";
      }
    }
    doLogout();
  }, [router, supabase]);

  return (
    <main className="min-h-screen bg-[#0B0E14] text-white flex flex-col items-center justify-center p-5">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">
          Signing out of MixxSocial...
        </p>
      </div>
    </main>
  );
}
