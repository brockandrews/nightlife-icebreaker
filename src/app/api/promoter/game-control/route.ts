import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { realtimeHub } from "@/lib/realtime";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, action, extendMinutes = 15 } = body;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    let updatedStatus = event.status;
    let updatedEndTime = event.gameEndTime;
    let updatedCompletedAt = event.completedAt;

    if (action === "PAUSE") {
      updatedStatus = "PAUSED";
    } else if (action === "RESUME") {
      updatedStatus = "ACTIVE";
      updatedCompletedAt = null;
    } else if (action === "EXTEND") {
      const baseTime = event.gameEndTime ? new Date(event.gameEndTime) : new Date();
      updatedEndTime = new Date(baseTime.getTime() + extendMinutes * 60 * 1000);
      updatedStatus = "ACTIVE";
    } else if (action === "LOCK_SCORING" || action === "END_GAME") {
      updatedStatus = "COMPLETED";
      updatedEndTime = new Date();
      updatedCompletedAt = new Date();
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: updatedStatus,
        gameEndTime: updatedEndTime,
        completedAt: updatedCompletedAt,
      },
    });

    // Broadcast updated game state
    realtimeHub.broadcast(`event:${eventId}`, "GAME_STATE_UPDATE", {
      status: updatedEvent.status,
      gameEndTime: updatedEvent.gameEndTime,
      action,
    });

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
