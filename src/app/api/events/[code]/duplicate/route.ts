import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedHost } from "@/lib/supabase/server";

// Generates an unambiguous 6-character uppercase alphanumeric code (omitting 0, O, 1, I, L)
function generate6CharDoorCode(): string {
  const chars = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  return code;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const host = await getAuthenticatedHost();

    if (!host) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to duplicate this event." },
        { status: 401 }
      );
    }

    // Role check: Door staff cannot duplicate events
    if (host.role === "DOOR_STAFF") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Door staff are not authorized to duplicate events." },
        { status: 403 }
      );
    }

    // Enforce paywall / credit check
    const totalCredits = (host.freeEventsRemaining || 0) + (host.purchasedCredits || 0);
    if (totalCredits <= 0) {
      return NextResponse.json(
        {
          success: false,
          code: "PAYWALL_REQUIRED",
          error: "You have no event passes remaining. Please purchase event credits to duplicate this game.",
        },
        { status: 402 }
      );
    }

    const { code: id } = await params;

    // Fetch original event
    const originalEvent = await prisma.event.findFirst({
      where: {
        OR: [{ id }, { doorCodeToken: id.toUpperCase() }],
        hostId: host.id,
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!originalEvent) {
      return NextResponse.json(
        { success: false, error: "Event not found or does not belong to your organization." },
        { status: 404 }
      );
    }

    // Parse optional custom parameters from body
    const body = await request.json().catch(() => ({}));
    const newScheduledDate = body.scheduledDate
      ? new Date(body.scheduledDate)
      : new Date();
    const newEndTime = body.endTime
      ? new Date(body.endTime)
      : new Date(newScheduledDate.getTime() + 6 * 60 * 60 * 1000);
    const newName = body.name || `${originalEvent.name} (Copy)`;

    // Generate unique 6-character door code token
    let newDoorCode = generate6CharDoorCode();
    let collision = await prisma.event.findUnique({ where: { doorCodeToken: newDoorCode } });
    let attempts = 0;
    while (collision && attempts < 10) {
      newDoorCode = generate6CharDoorCode();
      collision = await prisma.event.findUnique({ where: { doorCodeToken: newDoorCode } });
      attempts++;
    }

    // Clone event settings, branding, and config
    const newEvent = await prisma.event.create({
      data: {
        hostId: host.id,
        themePackId: originalEvent.themePackId,
        name: newName,
        venueName: originalEvent.venueName,
        accentColor: originalEvent.accentColor,
        logoUrl: originalEvent.logoUrl,
        sponsorLogoUrl: originalEvent.sponsorLogoUrl,
        sponsorMessage: originalEvent.sponsorMessage,
        scheduledDate: newScheduledDate,
        startTime: newScheduledDate,
        endTime: newEndTime,
        gameStartTime: newScheduledDate,
        gameEndTime: newEndTime,
        cardSize: originalEvent.cardSize,
        scoringModel: originalEvent.scoringModel,
        completionMode: originalEvent.completionMode,
        prizeDescription: originalEvent.prizeDescription,
        doorCodeToken: newDoorCode,
        status: "ACTIVE",
      },
    });

    // Deep clone all pinned questions so the new game has its own immutable questions
    if (originalEvent.questions && originalEvent.questions.length > 0) {
      await prisma.question.createMany({
        data: originalEvent.questions.map((q) => ({
          themePackId: q.themePackId,
          eventId: newEvent.id,
          category: q.category,
          prompt: q.prompt,
          options: q.options,
          traitTemplate: q.traitTemplate,
          conversationPrompt: q.conversationPrompt,
          isCustom: q.isCustom,
          order: q.order,
        })),
      });
    }

    // Deduct 1 credit (prioritize free passes, then purchased credits)
    if (host.freeEventsRemaining > 0) {
      await prisma.host.update({
        where: { id: host.id },
        data: { freeEventsRemaining: { decrement: 1 } },
      });
    } else {
      await prisma.host.update({
        where: { id: host.id },
        data: { purchasedCredits: { decrement: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      event: newEvent,
      message: `Event successfully cloned as "${newEvent.name}" with Door Code ${newEvent.doorCodeToken}!`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
