import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/utils";
import { STANDARD_QUESTION_BANK } from "@/lib/constants";
import { getAuthenticatedHost } from "@/lib/supabase/server";

export async function GET() {
  try {
    const host = await getAuthenticatedHost();

    if (!host) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to view your host dashboard." },
        { status: 401 }
      );
    }

    // Strictly fetch events owned by the authenticated host, ordered newest to oldest by scheduled date
    const events = await prisma.event.findMany({
      where: {
        hostId: host.id,
      },
      include: {
        _count: {
          select: {
            players: true,
            connections: true,
          },
        },
      },
      orderBy: { scheduledDate: "desc" },
    });

    return NextResponse.json({ success: true, events, host });
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

    if (!host) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. You must be signed in to create an event." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      venueName,
      scheduledDate,
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

    const eventScheduledDate = scheduledDate
      ? new Date(scheduledDate)
      : startTime
      ? new Date(startTime)
      : new Date();

    const eventEndTime = endTime
      ? new Date(endTime)
      : new Date(eventScheduledDate.getTime() + 6 * 60 * 60 * 1000);

    const code =
      doorCodeToken?.toUpperCase().trim() ||
      `EVENT-${generateShortCode()}`;

    const newEvent = await prisma.event.create({
      data: {
        hostId: host.id,
        name: name || "MixxSocial Mixer & Game",
        venueName: venueName || "Lounge & Club",
        accentColor: accentColor || "#06B6D4",
        logoUrl,
        sponsorLogoUrl,
        sponsorMessage,
        scheduledDate: eventScheduledDate,
        startTime: eventScheduledDate,
        endTime: eventEndTime,
        gameStartTime: eventScheduledDate,
        gameEndTime: eventEndTime,
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
