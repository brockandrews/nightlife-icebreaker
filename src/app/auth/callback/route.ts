import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/promoter";

  // Account for reverse proxies / load balancers (e.g. Vercel, AWS)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const isLocalEnv = process.env.NODE_ENV === "development";
  const baseUrl =
    isLocalEnv || !forwardedHost
      ? origin
      : `${forwardedProto}://${forwardedHost}`;

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return NextResponse.redirect(`${baseUrl}${next}`);
      } else {
        console.error("Supabase exchangeCodeForSession failed:", error);
        return NextResponse.redirect(
          `${baseUrl}/login?error=${encodeURIComponent(error.message || "auth_failed")}`
        );
      }
    } catch (err: any) {
      console.error("Error exchanging auth code in callback:", err);
      return NextResponse.redirect(`${baseUrl}/login?error=server_error`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=missing_code`);
}
