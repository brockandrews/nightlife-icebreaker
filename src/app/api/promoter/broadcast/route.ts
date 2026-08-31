import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { realtimeHub } from "@/lib/realtime";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, message } = body;

    if (!eventId || !message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "Event ID and message are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        eventId,
        message: message.trim(),
      },
    });

    // Broadcast announcement to all connected players in this event
    realtimeHub.broadcast(`event:${eventId}`, "BROADCAST_ANNOUNCEMENT", {
      id: announcement.id,
      message: announcement.message,
      createdAt: announcement.createdAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      announcement,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
