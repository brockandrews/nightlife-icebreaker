import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/utils";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
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

    return NextResponse.json({ success: true, events });
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
    const {
      name,
      venueName,
      startTime,
      endTime,
      cardSize = "5x5",
      scoringModel = "MOST_CONNECTIONS",
      completionMode = "AUTO_FILL",
      prizeDescription = "VIP Bottle Service & Drinks",
      doorCodeToken,
    } = body;

    const code =
      doorCodeToken?.toUpperCase().trim() ||
      `EVENT-${generateShortCode()}`;

    const newEvent = await prisma.event.create({
      data: {
        name: name || "Nightlife Icebreaker Mixer",
        venueName: venueName || "Lounge & Club",
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

    // Copy global questions to this event
    const globalQuestions = await prisma.question.findMany({
      where: { eventId: null },
    });

    if (globalQuestions.length > 0) {
      await prisma.question.createMany({
        data: globalQuestions.map((q) => ({
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
    }

    return NextResponse.json({ success: true, event: newEvent });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
