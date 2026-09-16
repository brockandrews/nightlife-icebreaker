import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reporterId, reportedId, reason } = body;

    if (!reporterId || !reportedId || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const reporter = await prisma.player.findUnique({
      where: { id: reporterId },
    });

    if (!reporter) {
      return NextResponse.json(
        { success: false, error: "Reporter player not found" },
        { status: 404 }
      );
    }

    // Resolve reported target player by ID, 4-letter PIN, or name
    let targetPlayer = await prisma.player.findUnique({
      where: { id: reportedId },
    });

    if (!targetPlayer) {
      const trimmed = String(reportedId).trim();
      targetPlayer = await prisma.player.findFirst({
        where: {
          eventId: reporter.eventId,
          OR: [
            { shortCode: trimmed.toUpperCase() },
            { displayName: { equals: trimmed, mode: "insensitive" } },
          ],
        },
      });
    }

    if (!targetPlayer) {
      return NextResponse.json(
        {
          success: false,
          error: `Could not find player "${reportedId}". Please choose from your connection list or enter their 4-letter PIN.`,
        },
        { status: 404 }
      );
    }

    const report = await prisma.report.create({
      data: {
        eventId: reporter.eventId,
        reporterId,
        reportedId: targetPlayer.id,
        reason: reason.trim(),
        status: "PENDING",
      },
      include: {
        reporter: { select: { displayName: true, shortCode: true } },
        reported: { select: { displayName: true, shortCode: true } },
      },
    });

    // Automatically block reported user
    await prisma.blockedPlayer.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: reporterId,
          blockedId: targetPlayer.id,
        },
      },
      update: {},
      create: {
        blockerId: reporterId,
        blockedId: targetPlayer.id,
      },
    });

    // Broadcast safety report alert to Host Live Console
    const { realtimeHub } = await import("@/lib/realtime");
    realtimeHub.broadcast(`event:${reporter.eventId}`, "SAFETY_REPORT_ALERT", {
      reportId: report.id,
      reporterName: report.reporter.displayName,
      reportedName: report.reported.displayName,
      reason: report.reason,
      createdAt: report.createdAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Report received. The player has been blocked from connecting with you.",
      reportId: report.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
