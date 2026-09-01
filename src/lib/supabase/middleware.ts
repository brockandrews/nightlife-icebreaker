import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth token if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;

  // If OAuth or email verification redirects to any page with ?code=, forward directly to /auth/callback
  if (searchParams.has("code") && path !== "/auth/callback") {
    const code = searchParams.get("code")!;
    const next = searchParams.get("next") || "/promoter";
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.searchParams.set("code", code);
    callbackUrl.searchParams.set("next", next);
    return NextResponse.redirect(callbackUrl);
  }

  // Protect Host & Promoter paths (except public projector/qr pages if needed, but promoter dashboard & management requires auth)
  const isProtectedHostRoute =
    path.startsWith("/promoter") || path.startsWith("/host");
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/forgot-password");

  // If visiting protected host route without an active session -> redirect to /login
  if (!user && isProtectedHostRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  // If already logged in and visiting login/signup -> redirect to /promoter
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/promoter";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
