import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executeHandshakeEvaluation, getLiveLeaderboard } from "@/lib/game-engine";
import { realtimeHub } from "@/lib/realtime";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const body = await request.json();
    const { action = "CONFIRM" } = body; // "CONFIRM" or "DISMISS"

    const attempt = await prisma.connectionAttempt.findUnique({
      where: { id: attemptId },
      include: {
        initiator: true,
        target: true,
        event: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: "Connection attempt not found" },
        { status: 404 }
      );
    }

    if (attempt.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `This request has already been ${attempt.status.toLowerCase()}`,
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Check if 60s window expired
    if (now > attempt.expiresAt) {
      await prisma.connectionAttempt.update({
        where: { id: attemptId },
        data: { status: "EXPIRED", resolvedAt: now },
      });

      realtimeHub.broadcast(`player:${attempt.initiatorId}`, "HANDSHAKE_EXPIRED", {
        attemptId,
        message: "The 60-second connection window expired.",
      });

      return NextResponse.json(
        { success: false, error: "Connection window has expired" },
        { status: 400 }
      );
    }

    if (action === "DISMISS") {
      await prisma.connectionAttempt.update({
        where: { id: attemptId },
        data: { status: "DISMISSED", resolvedAt: now },
      });

      realtimeHub.broadcast(`player:${attempt.initiatorId}`, "HANDSHAKE_DISMISSED", {
        attemptId,
        message: `${attempt.target.displayName} declined the connection.`,
      });

      return NextResponse.json({
        success: true,
        status: "DISMISSED",
      });
    }

    // Process CONFIRMATION
    await prisma.connectionAttempt.update({
      where: { id: attemptId },
      data: { status: "CONFIRMED", resolvedAt: now },
    });

    // Execute server-authoritative evaluation
    const result = await executeHandshakeEvaluation(
      attempt.eventId,
      attempt.initiatorId,
      attempt.targetId
    );

    // Notify Initiator (Player A)
    realtimeHub.broadcast(`player:${attempt.initiatorId}`, "HANDSHAKE_RESOLVED", {
      attemptId,
      status: "CONFIRMED",
      partnerId: attempt.target.id,
      partnerName: attempt.target.displayName,
      partnerShortCode: attempt.target.shortCode,
      candidateSquares: result.playerA.candidateSquares,
      autoClaimedSquare: result.playerA.autoClaimedSquare,
      requiresSelection: result.playerA.requiresSelection,
      completionMode: attempt.event.completionMode,
    });

    // Notify Target (Player B)
    realtimeHub.broadcast(`player:${attempt.targetId}`, "HANDSHAKE_RESOLVED", {
      attemptId,
      status: "CONFIRMED",
      partnerId: attempt.initiator.id,
      partnerName: attempt.initiator.displayName,
      partnerShortCode: attempt.initiator.shortCode,
      candidateSquares: result.playerB.candidateSquares,
      autoClaimedSquare: result.playerB.autoClaimedSquare,
      requiresSelection: result.playerB.requiresSelection,
      completionMode: attempt.event.completionMode,
    });

    // Broadcast Leaderboard & Projector updates
    const updatedLeaderboard = await getLiveLeaderboard(attempt.eventId);
    realtimeHub.broadcast(`event:${attempt.eventId}`, "LEADERBOARD_UPDATE", {
      leaderboard: updatedLeaderboard,
      latestConnection: {
        playerA: attempt.initiator.displayName,
        playerB: attempt.target.displayName,
        confirmedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      status: "CONFIRMED",
      partnerId: attempt.initiator.id,
      partnerName: attempt.initiator.displayName,
      partnerShortCode: attempt.initiator.shortCode,
      candidateSquares: result.playerB.candidateSquares,
      autoClaimedSquare: result.playerB.autoClaimedSquare,
      requiresSelection: result.playerB.requiresSelection,
      completionMode: attempt.event.completionMode,
    });
  } catch (error: any) {
    console.error("Handshake confirm error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to confirm handshake" },
      { status: 500 }
    );
  }
}
