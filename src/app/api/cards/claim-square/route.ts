import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { claimSquareSelection, getLiveLeaderboard } from "@/lib/game-engine";
import { realtimeHub } from "@/lib/realtime";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId, squareId, matchedPlayerId, matchedPlayerName } = body;

    if (!playerId || !squareId || !matchedPlayerId || !matchedPlayerName) {
      return NextResponse.json(
        { success: false, error: "Missing required claim parameters" },
        { status: 400 }
      );
    }

    const result = await claimSquareSelection(
      playerId,
      squareId,
      matchedPlayerId,
      matchedPlayerName
    );

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { event: true },
    });

    if (player) {
      // Broadcast live leaderboard update
      const updatedLeaderboard = await getLiveLeaderboard(player.eventId);
      realtimeHub.broadcast(`event:${player.eventId}`, "LEADERBOARD_UPDATE", {
        leaderboard: updatedLeaderboard,
      });
    }

    return NextResponse.json({
      success: true,
      square: result.square,
      isWin: result.isWin,
      winType: result.winType,
    });
  } catch (error: any) {
    console.error("Claim square error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to claim square" },
      { status: 500 }
    );
  }
}
