import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=missing_code`);
  }

  try {
    const cookieStore = await cookies();
    const redirectUrl = new URL(next, baseUrl);
    const response = NextResponse.redirect(redirectUrl);

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
                // Ignore if cookieStore is sealed in current phase
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

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Supabase exchangeCodeForSession failed:", error);
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent(error.message || "auth_failed")}`
      );
    }

    if (data?.user) {
      const user = data.user;
      const email = user.email ? user.email.trim().toLowerCase() : null;

      if (email) {
        try {
          const metadata = user.user_metadata || {};
          const displayName =
            metadata.displayName ||
            metadata.full_name ||
            metadata.name ||
            email.split("@")[0] ||
            "Event Host";
          const organization =
            metadata.organization || metadata.company || "Independent Host";

          // 1. Check if Host exists by ID
          const existingHostById = await prisma.host.findUnique({
            where: { id: user.id },
          });

          if (existingHostById) {
            await prisma.host.update({
              where: { id: user.id },
              data: {
                email,
                displayName: existingHostById.displayName || displayName,
              },
            });
          } else {
            // 2. Check if Host exists by email (e.g. registered before under different provider)
            const existingHostByEmail = await prisma.host.findUnique({
              where: { email },
            });

            if (existingHostByEmail) {
              console.log(
                `Existing host found for email ${email} with ID ${existingHostByEmail.id}`
              );
            } else {
              // 3. Check if user was invited as a TeamMember
              const teamMember = await prisma.teamMember.findFirst({
                where: {
                  OR: [{ email }, { userId: user.id }],
                },
              });

              if (teamMember) {
                if (!teamMember.userId) {
                  await prisma.teamMember.update({
                    where: { id: teamMember.id },
                    data: { userId: user.id },
                  });
                }
              } else {
                // 4. Provision as new Host OWNER
                await prisma.host.create({
                  data: {
                    id: user.id,
                    email,
                    displayName,
                    organization,
                    role: "OWNER",
                    freeEventsRemaining: 1,
                  },
                });
              }
            }
          }
        } catch (dbErr) {
          console.error("Non-fatal error syncing Host profile in callback:", dbErr);
        }
      }

      return response;
    }

    return NextResponse.redirect(`${baseUrl}/login?error=no_user`);
  } catch (err: any) {
    console.error("Fatal error in auth/callback:", err);
    return NextResponse.redirect(`${baseUrl}/login?error=server_error`);
  }
}
