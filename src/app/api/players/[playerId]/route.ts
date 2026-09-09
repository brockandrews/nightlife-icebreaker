import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: {
        event: true,
        card: {
          include: {
            squares: {
              orderBy: { position: "asc" },
            },
          },
        },
        surveyResponses: {
          include: { question: true },
        },
        initiatedConnections: {
          include: { playerB: true },
          orderBy: { confirmedAt: "desc" },
        },
        receivedConnections: {
          include: { playerA: true },
          orderBy: { confirmedAt: "desc" },
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 }
      );
    }

    // Update lastActiveAt
    await prisma.player.update({
      where: { id: playerId },
      data: { lastActiveAt: new Date() },
    });

    // Check for any pending connection attempts directed at this player
    const pendingIncomingAttempt = await prisma.connectionAttempt.findFirst({
      where: {
        targetId: playerId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        initiator: {
          select: { id: true, displayName: true, shortCode: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format connections list
    const connections = [
      ...player.initiatedConnections.map((c) => ({
        id: c.id,
        connectedWith: c.playerB.displayName,
        shortCode: c.playerB.shortCode,
        confirmedAt: c.confirmedAt,
        squaresSatisfied: c.squaresSatisfiedA,
      })),
      ...player.receivedConnections.map((c) => ({
        id: c.id,
        connectedWith: c.playerA.displayName,
        shortCode: c.playerA.shortCode,
        confirmedAt: c.confirmedAt,
        squaresSatisfied: c.squaresSatisfiedB,
      })),
    ].sort(
      (a, b) =>
        new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime()
    );

    // Fetch latest active announcement for this event (within last 30 minutes)
    const recentThreshold = new Date(Date.now() - 30 * 60 * 1000);
    const latestAnnouncement = await prisma.announcement.findFirst({
      where: {
        eventId: player.eventId,
        createdAt: { gte: recentThreshold },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        displayName: player.displayName,
        shortCode: player.shortCode,
        identityToken: player.identityToken,
        checkedInAt: player.checkedInAt,
        eventId: player.eventId,
      },
      event: {
        id: player.event.id,
        name: player.event.name,
        venueName: player.event.venueName,
        status: player.event.status,
        cardSize: player.event.cardSize,
        scoringModel: player.event.scoringModel,
        completionMode: player.event.completionMode,
        prizeDescription: player.event.prizeDescription,
        gameEndTime: player.event.gameEndTime,
      },
      card: player.card,
      connections,
      pendingIncomingAttempt: pendingIncomingAttempt
        ? {
            id: pendingIncomingAttempt.id,
            initiator: pendingIncomingAttempt.initiator,
            expiresAt: pendingIncomingAttempt.expiresAt,
            remainingSeconds: Math.max(
              0,
              Math.floor(
                (pendingIncomingAttempt.expiresAt.getTime() - Date.now()) / 1000
              )
            ),
          }
        : null,
      latestAnnouncement: latestAnnouncement
        ? {
            id: latestAnnouncement.id,
            message: latestAnnouncement.message,
            createdAt: latestAnnouncement.createdAt.toISOString(),
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
