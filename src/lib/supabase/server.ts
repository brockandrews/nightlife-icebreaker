import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

/**
 * Returns the currently authenticated Host record from Prisma (or team member context), or null if not logged in.
 */
export async function getAuthenticatedHost() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { prisma } = await import("@/lib/prisma");
    const host = await prisma.host.findUnique({
      where: { id: user.id },
    });

    if (host) {
      return {
        ...host,
        role: host.role || "OWNER",
        isOwner: true,
        isTeamMember: false,
      };
    }

    // Check if authenticated user is a team member under another host
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        OR: [
          { userId: user.id },
          ...(user.email ? [{ email: user.email }] : []),
        ],
      },
      include: { host: true },
    });

    if (teamMember) {
      // Link userId if not yet linked
      if (!teamMember.userId) {
        await prisma.teamMember.update({
          where: { id: teamMember.id },
          data: { userId: user.id },
        });
      }

      return {
        ...teamMember.host,
        role: teamMember.role,
        isOwner: teamMember.role === "OWNER",
        isTeamMember: true,
        memberId: teamMember.id,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting authenticated host:", error);
    return null;
  }
}
