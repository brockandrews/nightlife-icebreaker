import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedHost } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ doorCodeToken: code.toUpperCase() }, { id: code }],
      },
      include: {
        _count: {
          select: {
            players: true,
            connections: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const host = await getAuthenticatedHost();
    if (!host) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to edit event details." },
        { status: 401 }
      );
    }

    // Role check: Door staff cannot edit event settings
    if (host.role === "DOOR_STAFF") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Door staff are not authorized to edit event details." },
        { status: 403 }
      );
    }

    const { code } = await params;
    const body = await request.json().catch(() => ({}));
    const { name, venueName } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Event name is required and cannot be empty." },
        { status: 400 }
      );
    }

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ doorCodeToken: code.toUpperCase() }, { id: code }],
        hostId: host.id,
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found or does not belong to your organization." },
        { status: 404 }
      );
    }

    const updatedEvent = await prisma.event.update({
      where: { id: event.id },
      data: {
        name: name.trim().slice(0, 100),
        ...(venueName && typeof venueName === "string" ? { venueName: venueName.trim().slice(0, 100) } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: "Event updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
