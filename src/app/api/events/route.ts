import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/utils";
import { STANDARD_QUESTION_BANK } from "@/lib/constants";
import { getAuthenticatedHost } from "@/lib/supabase/server";

export async function GET() {
  try {
    const host = await getAuthenticatedHost();

    // Query events owned by this host (or global unassigned events if any)
    const whereClause = host
      ? {
          OR: [{ hostId: host.id }, { hostId: null }],
        }
      : {};

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            players: true,
            connections: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, events, host: host || null });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const host = await getAuthenticatedHost();

    const body = await request.json();
    const {
      name,
      venueName,
      startTime,
      endTime,
      cardSize = "5x5",
      scoringModel = "MOST_CONNECTIONS",
      completionMode = "AUTO_FILL",
      prizeDescription = "VIP Bottle Service & Drinks",
      accentColor,
      logoUrl,
      sponsorLogoUrl,
      sponsorMessage,
      doorCodeToken,
    } = body;

    const code =
      doorCodeToken?.toUpperCase().trim() ||
      `EVENT-${generateShortCode()}`;

    const newEvent = await prisma.event.create({
      data: {
        hostId: host?.id || null,
        name: name || "MixxSocial Mixer & Game",
        venueName: venueName || "Lounge & Club",
        accentColor: accentColor || "#06B6D4",
        logoUrl,
        sponsorLogoUrl,
        sponsorMessage,
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: endTime
          ? new Date(endTime)
          : new Date(Date.now() + 6 * 60 * 60 * 1000),
        gameStartTime: new Date(),
        gameEndTime: endTime
          ? new Date(endTime)
          : new Date(Date.now() + 6 * 60 * 60 * 1000),
        cardSize,
        scoringModel,
        completionMode,
        prizeDescription,
        doorCodeToken: code,
        status: "ACTIVE",
      },
    });

    // Seed standard questions for the new event
    await prisma.question.createMany({
      data: STANDARD_QUESTION_BANK.map((q) => ({
        eventId: newEvent.id,
        category: q.category,
        prompt: q.prompt,
        options: q.options,
        traitTemplate: q.traitTemplate,
        conversationPrompt: q.conversationPrompt,
        isCustom: false,
        order: q.order,
      })),
    });

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
