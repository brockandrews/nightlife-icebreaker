import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    let host = await prisma.host.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: { events: true },
        },
      },
    });

    // Auto-provision if missing
    if (!host) {
      const metadata = user.user_metadata || {};
      const displayName =
        metadata.displayName ||
        metadata.full_name ||
        user.email?.split("@")[0] ||
        "Event Host";
      const organization =
        metadata.organization || metadata.company || "Independent Host";

      host = await prisma.host.create({
        data: {
          id: user.id,
          email: user.email!,
          displayName,
          organization,
          role: "OWNER",
          freeEventsRemaining: 1,
        },
        include: {
          _count: {
            select: { events: true },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      host: {
        id: host.id,
        email: host.email,
        displayName: host.displayName,
        organization: host.organization,
        role: host.role,
        freeEventsRemaining: host.freeEventsRemaining,
        totalEventsCount: host._count.events,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
