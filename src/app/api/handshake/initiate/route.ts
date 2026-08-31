import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePairKey } from "@/lib/utils";
import { realtimeHub } from "@/lib/realtime";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { initiatorId, targetCode } = body;

    if (!initiatorId || !targetCode) {
      return NextResponse.json(
        { success: false, error: "Initiator ID and Target Code are required" },
        { status: 400 }
      );
    }

    const cleanCode = targetCode.trim().toUpperCase();

    // 1. Fetch initiator player
    const initiator = await prisma.player.findUnique({
      where: { id: initiatorId },
      include: { event: true },
    });

    if (!initiator) {
      return NextResponse.json(
        { success: false, error: "Initiator player not found" },
        { status: 404 }
      );
    }

    if (initiator.event.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          error:
            initiator.event.status === "PAUSED"
              ? "Game is currently paused by promoter"
              : "Game has ended",
        },
        { status: 400 }
      );
    }

    // 2. Anti-fraud: Cooldown check (20 seconds between initiated scans)
    if (initiator.lastScannedAt) {
      const elapsedSeconds =
        (Date.now() - new Date(initiator.lastScannedAt).getTime()) / 1000;
      const cooldownThreshold = 15; // 15s cooldown
      if (elapsedSeconds < cooldownThreshold) {
        const remaining = Math.ceil(cooldownThreshold - elapsedSeconds);
        return NextResponse.json(
          {
            success: false,
            error: `Please wait ${remaining}s before your next connection attempt`,
          },
          { status: 429 }
        );
      }
    }

    // 3. Find target player by shortCode or identityToken or id within the same event
    const target = await prisma.player.findFirst({
      where: {
        eventId: initiator.eventId,
        OR: [
          { shortCode: cleanCode },
          { identityToken: targetCode.trim() },
          { id: targetCode.trim() },
        ],
      },
    });

    if (!target) {
      return NextResponse.json(
        {
          success: false,
          error: "Player code not found in this event. Check the 4-letter code!",
        },
        { status: 404 }
      );
    }

    // 4. Anti-fraud: Self-scan check
    if (target.id === initiator.id) {
      return NextResponse.json(
        { success: false, error: "You cannot connect with your own code!" },
        { status: 400 }
      );
    }

    // 5. Anti-fraud: Block check
    const isBlocked = await prisma.blockedPlayer.findFirst({
      where: {
        OR: [
          { blockerId: initiator.id, blockedId: target.id },
          { blockerId: target.id, blockedId: initiator.id },
        ],
      },
    });

    if (isBlocked) {
      return NextResponse.json(
        { success: false, error: "Connection not available" },
        { status: 400 }
      );
    }

    // 6. Anti-fraud: Unique pair check (already connected?)
    const pairKey = generatePairKey(initiator.id, target.id);
    const existingConnection = await prisma.connection.findUnique({
      where: {
        eventId_pairKey: {
          eventId: initiator.eventId,
          pairKey,
        },
      },
    });

    if (existingConnection) {
      return NextResponse.json(
        {
          success: false,
          error: `You are already connected with ${target.displayName}! Find someone new.`,
        },
        { status: 400 }
      );
    }

    // 7. Expire any old pending attempts between these two
    await prisma.connectionAttempt.updateMany({
      where: {
        eventId: initiator.eventId,
        initiatorId: initiator.id,
        targetId: target.id,
        status: "PENDING",
      },
      data: { status: "EXPIRED" },
    });

    // 8. Create ConnectionAttempt with 60-second window
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 1000);

    const attempt = await prisma.connectionAttempt.create({
      data: {
        eventId: initiator.eventId,
        initiatorId: initiator.id,
        targetId: target.id,
        status: "PENDING",
        createdAt: now,
        expiresAt,
      },
    });

    // Update initiator's lastScannedAt
    await prisma.player.update({
      where: { id: initiator.id },
      data: { lastScannedAt: now },
    });

    // 9. Push Real-time prompt to Target Player B
    realtimeHub.broadcast(`player:${target.id}`, "HANDSHAKE_REQUEST", {
      attemptId: attempt.id,
      initiator: {
        id: initiator.id,
        displayName: initiator.displayName,
        shortCode: initiator.shortCode,
      },
      expiresAt: expiresAt.toISOString(),
      durationSeconds: 60,
    });

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      targetName: target.displayName,
      targetShortCode: target.shortCode,
      expiresAt: expiresAt.toISOString(),
      durationSeconds: 60,
    });
  } catch (error: any) {
    console.error("Handshake initiate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initiate handshake" },
      { status: 500 }
    );
  }
}
