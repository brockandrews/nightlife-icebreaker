import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLiveLeaderboard } from "@/lib/game-engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id: eventId }, { doorCodeToken: eventId.toUpperCase() }],
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    const leaderboard = await getLiveLeaderboard(event.id);

    // Compute stats HUD
    const totalPlayers = await prisma.player.count({
      where: { eventId: event.id },
    });

    const totalSurveysCompleted = await prisma.player.count({
      where: {
        eventId: event.id,
        surveyResponses: { some: {} },
      },
    });

    const totalConnections = await prisma.connection.count({
      where: { eventId: event.id },
    });

    const activePlayersCount = leaderboard.filter(
      (entry) => entry.connectionsCount > 0
    ).length;

    // Recent 5 verified connections for live ticker
    const recentConnections = await prisma.connection.findMany({
      where: { eventId: event.id },
      include: {
        playerA: { select: { displayName: true } },
        playerB: { select: { displayName: true } },
      },
      orderBy: { confirmedAt: "desc" },
      take: 8,
    });

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        venueName: event.venueName,
        status: event.status,
        cardSize: event.cardSize,
        scoringModel: event.scoringModel,
        completionMode: event.completionMode,
        prizeDescription: event.prizeDescription,
        gameStartTime: event.gameStartTime,
        gameEndTime: event.gameEndTime,
        doorCodeToken: event.doorCodeToken,
      },
      hud: {
        totalPlayers,
        totalSurveysCompleted,
        totalConnections,
        activePlayersCount,
        medianConnections:
          leaderboard.length > 0
            ? leaderboard[Math.floor(leaderboard.length / 2)]?.connectionsCount || 0
            : 0,
      },
      leaderboard,
      recentConnections: recentConnections.map((c) => ({
        id: c.id,
        playerA: c.playerA.displayName,
        playerB: c.playerB.displayName,
        confirmedAt: c.confirmedAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
