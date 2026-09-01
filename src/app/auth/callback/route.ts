import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/promoter";

  if (code) {
    const cookieStore = await cookies();
    const redirectUrl = new URL(next, origin);
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Sync or create Host record in Prisma
      try {
        const user = data.user;
        const metadata = user.user_metadata || {};
        const displayName =
          metadata.displayName ||
          metadata.full_name ||
          metadata.name ||
          user.email?.split("@")[0] ||
          "Event Host";
        const organization =
          metadata.organization || metadata.company || "Independent Host";

        await prisma.host.upsert({
          where: { id: user.id },
          create: {
            id: user.id,
            email: user.email!,
            displayName,
            organization,
            role: "OWNER",
            freeEventsRemaining: 1,
          },
          update: {
            email: user.email!,
            displayName,
          },
        });
      } catch (dbErr) {
        console.error("Failed to upsert Host profile:", dbErr);
      }

      return response;
    } else {
      console.error("Supabase exchangeCodeForSession failed:", error);
    }
  }

  // Return user to login if code exchange failed
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
