import { NextResponse } from "next/server";
import { createClient, getAuthenticatedHost } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let host = await getAuthenticatedHost();

    // Auto-provision if neither Host nor TeamMember exists yet
    if (!host) {
      const metadata = user.user_metadata || {};
      const displayName =
        metadata.displayName ||
        metadata.full_name ||
        user.email?.split("@")[0] ||
        "Event Host";
      const organization =
        metadata.organization || metadata.company || "Independent Host";

      const newHost = await prisma.host.create({
        data: {
          id: user.id,
          email: user.email!,
          displayName,
          organization,
          role: "OWNER",
          freeEventsRemaining: 1,
        },
      });

      host = {
        ...newHost,
        role: "OWNER",
        isOwner: true,
        isTeamMember: false,
      };
    }

    const totalEventsCount = await prisma.event.count({
      where: { hostId: host.id },
    });

    return NextResponse.json({
      success: true,
      host: {
        id: host.id,
        email: host.email,
        displayName: host.displayName,
        organization: host.organization,
        role: host.role,
        isOwner: host.isOwner,
        isTeamMember: host.isTeamMember,
        freeEventsRemaining: host.freeEventsRemaining,
        purchasedCredits: host.purchasedCredits ?? 0,
        totalEventsCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
