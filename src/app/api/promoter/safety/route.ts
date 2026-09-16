import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditEventAnomalies } from "@/lib/game-engine";
import { realtimeHub } from "@/lib/realtime";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: "eventId is required" },
        { status: 400 }
      );
    }

    const [reports, anomalies, disqualifiedPlayers] = await Promise.all([
      prisma.report.findMany({
        where: { eventId },
        include: {
          reporter: {
            select: { id: true, displayName: true, shortCode: true },
          },
          reported: {
            select: {
              id: true,
              displayName: true,
              shortCode: true,
              isDisqualified: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      auditEventAnomalies(eventId),
      prisma.player.findMany({
        where: { eventId, isDisqualified: true },
        select: {
          id: true,
          displayName: true,
          shortCode: true,
          disqualificationReason: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      reports,
      anomalies,
      disqualifiedPlayers,
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
    const { action, reportId, playerId, reason, note, eventId } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action is required" },
        { status: 400 }
      );
    }

    if (action === "RESOLVE_REPORT") {
      if (!reportId) {
        return NextResponse.json(
          { success: false, error: "reportId is required" },
          { status: 400 }
        );
      }
      const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          resolutionNote: note || null,
        },
      });
      if (eventId) {
        realtimeHub.broadcast(`event:${eventId}`, "SAFETY_UPDATE", {
          action: "RESOLVE_REPORT",
          reportId,
        });
      }
      return NextResponse.json({ success: true, report: updated });
    }

    if (action === "DISMISS_REPORT") {
      if (!reportId) {
        return NextResponse.json(
          { success: false, error: "reportId is required" },
          { status: 400 }
        );
      }
      const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
          status: "DISMISSED",
          resolvedAt: new Date(),
          resolutionNote: note || null,
        },
      });
      if (eventId) {
        realtimeHub.broadcast(`event:${eventId}`, "SAFETY_UPDATE", {
          action: "DISMISS_REPORT",
          reportId,
        });
      }
      return NextResponse.json({ success: true, report: updated });
    }

    if (action === "DISQUALIFY_PLAYER") {
      if (!playerId) {
        return NextResponse.json(
          { success: false, error: "playerId is required" },
          { status: 400 }
        );
      }
      const updated = await prisma.player.update({
        where: { id: playerId },
        data: {
          isDisqualified: true,
          disqualificationReason: reason || "Disqualified by host",
        },
      });

      // Clear any pending connection attempts involving this player
      await prisma.connectionAttempt.deleteMany({
        where: {
          OR: [{ initiatorId: playerId }, { targetId: playerId }],
          status: "PENDING",
        },
      });

      const targetEventId = eventId || updated.eventId;
      if (targetEventId) {
        realtimeHub.broadcast(`event:${targetEventId}`, "LEADERBOARD_UPDATE", {
          eventId: targetEventId,
        });
      }
      realtimeHub.broadcast(`player:${playerId}`, "PLAYER_DISQUALIFIED", {
        reason: updated.disqualificationReason,
      });

      return NextResponse.json({ success: true, player: updated });
    }

    if (action === "REINSTATE_PLAYER") {
      if (!playerId) {
        return NextResponse.json(
          { success: false, error: "playerId is required" },
          { status: 400 }
        );
      }
      const updated = await prisma.player.update({
        where: { id: playerId },
        data: {
          isDisqualified: false,
          disqualificationReason: null,
        },
      });

      const targetEventId = eventId || updated.eventId;
      if (targetEventId) {
        realtimeHub.broadcast(`event:${targetEventId}`, "LEADERBOARD_UPDATE", {
          eventId: targetEventId,
        });
      }
      realtimeHub.broadcast(`player:${playerId}`, "PLAYER_REINSTATED", {});

      return NextResponse.json({ success: true, player: updated });
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
