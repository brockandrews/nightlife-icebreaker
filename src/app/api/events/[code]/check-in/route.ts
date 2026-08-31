import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateShortCode } from "@/lib/utils";
import { generateBingoCard } from "@/lib/game-engine";
import { realtimeHub } from "@/lib/realtime";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const {
      displayName,
      ageConfirmed = true,
      marketingOptIn = false,
      contactEmail,
      contactPhone,
      surveyResponses, // Record<questionId, selectedOption>
    } = body;

    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Display name is required" },
        { status: 400 }
      );
    }

    if (!ageConfirmed) {
      return NextResponse.json(
        { success: false, error: "You must confirm the venue age requirement" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ doorCodeToken: code.toUpperCase() }, { id: code }],
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Generate unique 4-character shortCode for this event
    let shortCode = generateShortCode();
    let collision = await prisma.player.findUnique({
      where: {
        eventId_shortCode: {
          eventId: event.id,
          shortCode,
        },
      },
    });

    while (collision) {
      shortCode = generateShortCode();
      collision = await prisma.player.findUnique({
        where: {
          eventId_shortCode: {
            eventId: event.id,
            shortCode,
          },
        },
      });
    }

    // Create the Player
    const player = await prisma.player.create({
      data: {
        eventId: event.id,
        displayName: displayName.trim().slice(0, 30),
        shortCode,
        ageConfirmed,
        marketingOptIn: Boolean(marketingOptIn),
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
      },
    });

    // Save Survey Responses
    if (surveyResponses && typeof surveyResponses === "object") {
      const responseEntries = Object.entries(surveyResponses);
      for (const [questionId, selectedOption] of responseEntries) {
        if (typeof selectedOption === "string" && selectedOption.trim()) {
          const question = await prisma.question.findUnique({
            where: { id: questionId },
          });

          const derivedTrait = question
            ? question.traitTemplate.replace("{value}", selectedOption)
            : selectedOption;

          await prisma.surveyResponse.create({
            data: {
              playerId: player.id,
              questionId,
              selectedOption: selectedOption as string,
              derivedTrait,
            },
          });
        }
      }
    }

    // Generate Bingo Card for player
    const card = await generateBingoCard(
      player.id,
      event.id,
      (event.cardSize as "5x5" | "4x4") || "5x5"
    );

    // Broadcast new player check-in to promoter & projector
    realtimeHub.broadcast(`event:${event.id}`, "PLAYER_JOINED", {
      playerId: player.id,
      displayName: player.displayName,
      totalPlayers: await prisma.player.count({ where: { eventId: event.id } }),
    });

    return NextResponse.json({
      success: true,
      player: {
        id: player.id,
        displayName: player.displayName,
        shortCode: player.shortCode,
        identityToken: player.identityToken,
        eventId: event.id,
      },
      card,
      event: {
        id: event.id,
        name: event.name,
        venueName: event.venueName,
        cardSize: event.cardSize,
        scoringModel: event.scoringModel,
        completionMode: event.completionMode,
        prizeDescription: event.prizeDescription,
        status: event.status,
      },
    });
  } catch (error: any) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to check in" },
      { status: 500 }
    );
  }
}
