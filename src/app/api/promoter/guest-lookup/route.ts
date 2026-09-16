import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkCardWinCondition } from "@/lib/game-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const query = searchParams.get("query")?.trim() || "";

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "eventId is required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, cardSize: true },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    const whereClause: any = { eventId };
    if (query) {
      whereClause.OR = [
        { shortCode: { contains: query.toUpperCase(), mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
      ];
    }

    const players = await prisma.player.findMany({
      where: whereClause,
      include: {
        card: {
          include: {
            squares: true,
          },
        },
        initiatedConnections: true,
        receivedConnections: true,
      },
      take: 20,
      orderBy: { checkedInAt: "desc" },
    });

    const enrichedPlayers = await Promise.all(
      players.map(async (player) => {
        const totalConnections =
          player.initiatedConnections.length + player.receivedConnections.length;

        // Pending attempts involving this player
        const pendingAttempts = await prisma.connectionAttempt.findMany({
          where: {
            OR: [{ initiatorId: player.id }, { targetId: player.id }],
            status: "PENDING",
            expiresAt: { gt: new Date() },
          },
          include: {
            initiator: { select: { id: true, displayName: true, shortCode: true } },
            target: { select: { id: true, displayName: true, shortCode: true } },
          },
        });

        let completedSquares = 0;
        let totalSquares = 0;
        let hasWon = false;

        if (player.card) {
          totalSquares = player.card.squares.length;
          completedSquares = player.card.squares.filter((s) => s.isCompleted).length;
          const winStats = checkCardWinCondition(player.card.squares, event.cardSize);
          hasWon = winStats.isWin;
        }

        return {
          id: player.id,
          displayName: player.displayName,
          shortCode: player.shortCode,
          isDisqualified: player.isDisqualified,
          disqualificationReason: player.disqualificationReason,
          checkedInAt: player.checkedInAt,
          lastActiveAt: player.lastActiveAt,
          connectionsCount: totalConnections,
          cardStats: {
            completedSquares,
            totalSquares,
            hasWon,
          },
          pendingAttempts: pendingAttempts.map((att) => ({
            id: att.id,
            role: att.initiatorId === player.id ? "INITIATOR" : "TARGET",
            peer: att.initiatorId === player.id ? att.target : att.initiator,
            expiresAt: att.expiresAt,
            remainingSeconds: Math.max(
              0,
              Math.floor((att.expiresAt.getTime() - Date.now()) / 1000)
            ),
          })),
        };
      })
    );

    return NextResponse.json({
      success: true,
      players: enrichedPlayers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, playerId, attemptId } = body;

    if (action === "CLEAR_STUCK_ATTEMPT") {
      if (!attemptId && !playerId) {
        return NextResponse.json(
          { success: false, error: "Either attemptId or playerId is required" },
          { status: 400 }
        );
      }

      if (attemptId) {
        await prisma.connectionAttempt.deleteMany({
          where: { id: attemptId },
        });
      } else if (playerId) {
        await prisma.connectionAttempt.deleteMany({
          where: {
            OR: [{ initiatorId: playerId }, { targetId: playerId }],
            status: "PENDING",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Stuck connection attempts cleared successfully",
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
