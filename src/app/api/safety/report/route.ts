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

    const report = await prisma.report.create({
      data: {
        eventId: reporter.eventId,
        reporterId,
        reportedId,
        reason: reason.trim(),
      },
    });

    // Automatically block reported user as well
    await prisma.blockedPlayer.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: reporterId,
          blockedId: reportedId,
        },
      },
      update: {},
      create: {
        blockerId: reporterId,
        blockedId: reportedId,
      },
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
