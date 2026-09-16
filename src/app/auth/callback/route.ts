import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * Robustly constructs an absolute URL for redirects across local dev,
 * Vercel proxies, and multi-hop load balancers.
 */
function resolveRedirectUrl(request: Request, targetPathAndQuery: string): URL {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  // Multi-hop proxies (like Vercel) can send comma-separated values (e.g. "https,https" or "mixxsocial.com, vercel.app")
  const host = forwardedHost ? forwardedHost.split(",")[0].trim() : requestUrl.host;
  const rawProto = forwardedProto ? forwardedProto.split(",")[0].trim() : requestUrl.protocol.replace(":", "");

  // Default to https in production / non-localhost
  const isLocal =
    process.env.NODE_ENV === "development" ||
    host.includes("localhost") ||
    host.includes("127.0.0.1");
  const proto = isLocal ? (rawProto || "http") : "https";

  // Sanitize path to prevent open redirect vulnerabilities
  const cleanPath = targetPathAndQuery.startsWith("/")
    ? targetPathAndQuery
    : `/${targetPathAndQuery}`;
  const safePath = cleanPath.startsWith("//")
    ? `/${cleanPath.replace(/^\/+/, "")}`
    : cleanPath;

  try {
    return new URL(safePath, `${proto}://${host}`);
  } catch (err) {
    console.error(
      "Failed to construct forwarded redirect URL, falling back to origin:",
      err
    );
    return new URL(safePath, requestUrl.origin);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/promoter";

  if (!code) {
    const errorRedirectUrl = resolveRedirectUrl(
      request,
      "/login?error=missing_code"
    );
    return NextResponse.redirect(errorRedirectUrl);
  }

  try {
    const cookieStore = await cookies();
    const destinationUrl = resolveRedirectUrl(request, next);
    const response = NextResponse.redirect(destinationUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            try {
              return cookieStore.getAll();
            } catch {
              return [];
            }
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch {
                try {
                  cookieStore.set({ name, value, ...options });
                } catch {
                  // Ignore if cookieStore is sealed
                }
              }
              try {
                response.cookies.set(name, value, options);
              } catch {
                // Ignore if response headers are closed
              }
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Supabase exchangeCodeForSession failed:", error);
      const errorRedirectUrl = resolveRedirectUrl(
        request,
        `/login?error=${encodeURIComponent(error.message || "auth_failed")}`
      );
      return NextResponse.redirect(errorRedirectUrl);
    }

    return response;
  } catch (err: any) {
    console.error("Fatal error in auth/callback:", err);
    const serverErrorUrl = resolveRedirectUrl(
      request,
      "/login?error=server_error"
    );
    return NextResponse.redirect(serverErrorUrl);
  }
}
