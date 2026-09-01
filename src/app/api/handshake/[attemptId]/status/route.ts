import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { claimSquareSelection } from "@/lib/game-engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const { searchParams } = new URL(request.url);
    const callerPlayerId = searchParams.get("playerId");

    const attempt = await prisma.connectionAttempt.findUnique({
      where: { id: attemptId },
      include: {
        initiator: true,
        target: true,
        event: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: "Attempt not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const isExpired =
      attempt.status === "PENDING" && now > attempt.expiresAt;

    const currentStatus = isExpired ? "EXPIRED" : attempt.status;

    // If not confirmed yet or expired/dismissed, return base status
    if (currentStatus !== "CONFIRMED") {
      return NextResponse.json({
        success: true,
        status: currentStatus,
        attemptId: attempt.id,
        initiator: {
          id: attempt.initiator.id,
          displayName: attempt.initiator.displayName,
          shortCode: attempt.initiator.shortCode,
        },
        target: {
          id: attempt.target.id,
          displayName: attempt.target.displayName,
          shortCode: attempt.target.shortCode,
        },
        expiresAt: attempt.expiresAt,
        remainingSeconds: Math.max(
          0,
          Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000)
        ),
      });
    }

    // Attempt is CONFIRMED — Resolve match data for the caller
    const isInitiator = !callerPlayerId || callerPlayerId === attempt.initiatorId;
    const self = isInitiator ? attempt.initiator : attempt.target;
    const partner = isInitiator ? attempt.target : attempt.initiator;

    // Fetch caller's card and partner's survey traits
    const [selfWithCard, partnerResponses] = await Promise.all([
      prisma.player.findUnique({
        where: { id: self.id },
        include: { card: { include: { squares: true } } },
      }),
      prisma.surveyResponse.findMany({
        where: { playerId: partner.id },
      }),
    ]);

    const partnerTraits = new Set(
      partnerResponses.map((r) => `${r.questionId}::${r.selectedOption}`)
    );

    // Check if partner has already stamped a square on caller's card
    const alreadyClaimedSquare = selfWithCard?.card?.squares.find(
      (sq) => sq.matchedPlayerId === partner.id
    );

    let autoClaimedSquare = alreadyClaimedSquare || null;
    let candidateSquares: {
      id: string;
      position: number;
      promptText: string;
      conversationPrompt: string | null;
    }[] = [];
    let requiresSelection = false;

    if (!alreadyClaimedSquare && selfWithCard?.card) {
      for (const sq of selfWithCard.card.squares) {
        if (!sq.isCompleted && partnerTraits.has(sq.traitId)) {
          candidateSquares.push({
            id: sq.id,
            position: sq.position,
            promptText: sq.promptText,
            conversationPrompt: sq.conversationPrompt,
          });
        }
      }

      if (candidateSquares.length === 1) {
        // Auto-claim the single match
        try {
          const claimRes = await claimSquareSelection(
            self.id,
            candidateSquares[0].id,
            partner.id,
            partner.displayName
          );
          autoClaimedSquare = claimRes.square;
          candidateSquares = [];
          requiresSelection = false;
        } catch (e) {
          // If already claimed concurrently
        }
      } else if (candidateSquares.length > 1) {
        requiresSelection = true;
      }
    }

    return NextResponse.json({
      success: true,
      status: "CONFIRMED",
      attemptId: attempt.id,
      partnerId: partner.id,
      partnerName: partner.displayName,
      partnerShortCode: partner.shortCode,
      candidateSquares,
      autoClaimedSquare,
      requiresSelection,
      completionMode: attempt.event.completionMode,
    });
  } catch (error: any) {
    console.error("Handshake status check error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
