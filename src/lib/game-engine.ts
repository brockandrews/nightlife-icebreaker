import { prisma } from "./prisma";
import { shuffleArray } from "./utils";

export interface TraitDefinition {
  id: string;
  category: string;
  promptText: string;
  conversationPrompt: string;
}

/**
 * Cleanly formats a trait prompt so it reads naturally in English
 */
export function formatPromptText(template: string, value: string): string {
  if (template === "{value}") {
    const v = value.trim();
    if (v.toLowerCase().startsWith("lived") || v.toLowerCase().startsWith("backpacked") || v.toLowerCase().startsWith("taken") || v.toLowerCase().startsWith("island")) {
      return `Find someone who has ${v.toLowerCase()}`;
    }
    if (v.toLowerCase().startsWith("born") || v.toLowerCase().startsWith("moved") || v.toLowerCase().startsWith("visiting")) {
      return `Find someone who is ${v.toLowerCase()}`;
    }
    return `Find someone who ${v.toLowerCase()}`;
  }

  const raw = template.replace("{value}", value).trim();
  if (raw.toLowerCase().startsWith("find someone who")) {
    return raw;
  }
  return `Find someone who ${raw.toLowerCase()}`;
}

/**
 * Generates a balanced, randomized bingo card for a newly registered player.
 * @param playerId The player's ID
 * @param eventId The event's ID
 * @param cardSize "5x5" (25 squares, center free) or "4x4" (16 squares)
 */
export async function generateBingoCard(
  playerId: string,
  eventId: string,
  cardSize: "5x5" | "4x4" = "5x5"
) {
  // Check if card already exists
  const existingCard = await prisma.card.findUnique({
    where: { playerId },
    include: { squares: true },
  });

  if (existingCard) {
    return existingCard;
  }

  // Fetch all questions and traits available for this event
  const questions = await prisma.question.findMany({
    where: {
      OR: [{ eventId }, { eventId: null }],
    },
    orderBy: { order: "asc" },
  });

  // Extract all possible traits from question options
  const traitPool: TraitDefinition[] = [];
  for (const q of questions) {
    let options: string[] = [];
    try {
      options = JSON.parse(q.options);
    } catch {
      options = [];
    }

    for (const opt of options) {
      const promptText = formatPromptText(q.traitTemplate, opt);
      const conversationPrompt = q.conversationPrompt
        ? q.conversationPrompt.replace("{value}", opt)
        : `Ask them about their experience with ${opt}!`;

      traitPool.push({
        id: `${q.id}::${opt}`,
        category: q.category,
        promptText,
        conversationPrompt,
      });
    }
  }

  // Shuffle the trait pool
  const shuffledTraits = shuffleArray(traitPool);

  const totalSquares = cardSize === "4x4" ? 16 : 25;
  const freePosition = cardSize === "5x5" ? 12 : -1; // Center of 5x5 is index 12

  // Create the Card record
  const card = await prisma.card.create({
    data: {
      playerId,
      eventId,
      isCompleted: false,
    },
  });

  // Generate squares
  let traitIndex = 0;
  const squareCreates = [];

  for (let pos = 0; pos < totalSquares; pos++) {
    if (pos === freePosition) {
      squareCreates.push({
        cardId: card.id,
        position: pos,
        traitId: "FREE_SPACE",
        promptText: "⭐ FREE SPACE (Welcome to the party!)",
        conversationPrompt: "Say hi to someone new standing nearby!",
        isFreeSpace: true,
        isCompleted: true,
        completedAt: new Date(),
      });
    } else {
      const trait = shuffledTraits[traitIndex % shuffledTraits.length];
      traitIndex++;

      squareCreates.push({
        cardId: card.id,
        position: pos,
        traitId: trait ? trait.id : `DEFAULT_${pos}`,
        promptText: trait ? trait.promptText : "Find someone who loves nightlife!",
        conversationPrompt: trait ? trait.conversationPrompt : "Ask them what brought them here tonight!",
        isFreeSpace: false,
        isCompleted: false,
      });
    }
  }

  await prisma.cardSquare.createMany({
    data: squareCreates,
  });

  return prisma.card.findUnique({
    where: { id: card.id },
    include: {
      squares: {
        orderBy: { position: "asc" },
      },
    },
  });
}

/**
 * Checks win conditions (lines/bingo) on a card.
 */
export function checkCardWinCondition(
  squares: { position: number; isCompleted: boolean }[],
  cardSize: "5x5" | "4x4" = "5x5"
): { isWin: boolean; winType: string | null } {
  const size = cardSize === "5x5" ? 5 : 4;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  for (const s of squares) {
    const row = Math.floor(s.position / size);
    const col = s.position % size;
    if (row < size && col < size) {
      grid[row][col] = s.isCompleted;
    }
  }

  // Check Rows
  for (let r = 0; r < size; r++) {
    if (grid[r].every(Boolean)) {
      return { isWin: true, winType: `ROW_${r + 1}` };
    }
  }

  // Check Columns
  for (let c = 0; c < size; c++) {
    let colFull = true;
    for (let r = 0; r < size; r++) {
      if (!grid[r][c]) {
        colFull = false;
        break;
      }
    }
    if (colFull) {
      return { isWin: true, winType: `COL_${c + 1}` };
    }
  }

  // Check Main Diagonal (\)
  let diag1 = true;
  for (let i = 0; i < size; i++) {
    if (!grid[i][i]) {
      diag1 = false;
      break;
    }
  }
  if (diag1) {
    return { isWin: true, winType: "DIAGONAL_MAIN" };
  }

  // Check Anti Diagonal (/)
  let diag2 = true;
  for (let i = 0; i < size; i++) {
    if (!grid[i][size - 1 - i]) {
      diag2 = false;
      break;
    }
  }
  if (diag2) {
    return { isWin: true, winType: "DIAGONAL_ANTI" };
  }

  // Check Blackout
  const allCompleted = squares.every((s) => s.isCompleted);
  if (allCompleted) {
    return { isWin: true, winType: "BLACKOUT" };
  }

  return { isWin: false, winType: null };
}

/**
 * Claims a specific square on a player's card from a verified partner.
 * Strictly enforces that ONE person can only match to ONE square per card.
 */
export async function claimSquareSelection(
  playerId: string,
  squareId: string,
  matchedPlayerId: string,
  matchedPlayerName: string
) {
  const square = await prisma.cardSquare.findUnique({
    where: { id: squareId },
    include: { card: { include: { squares: true, event: true } } },
  });

  if (!square) {
    throw new Error("Square not found");
  }

  if (square.card.playerId !== playerId) {
    throw new Error("Square does not belong to this player");
  }

  if (square.isCompleted) {
    throw new Error("This square is already completed");
  }

  // Anti-abuse rule: Enforce that matchedPlayerId has not already been used on this card
  const alreadyMatchedSquare = square.card.squares.find(
    (sq) => sq.matchedPlayerId === matchedPlayerId && sq.id !== squareId
  );

  if (alreadyMatchedSquare) {
    throw new Error(
      `${matchedPlayerName} has already stamped another square on your card!`
    );
  }

  const now = new Date();

  // Mark square completed
  const updatedSquare = await prisma.cardSquare.update({
    where: { id: squareId },
    data: {
      isCompleted: true,
      matchedPlayerId,
      matchedPlayerName,
      completedAt: now,
    },
  });

  // Check Win Condition
  const allSquares = await prisma.cardSquare.findMany({
    where: { cardId: square.card.id },
  });

  const cardSize = (square.card.event?.cardSize as "5x5" | "4x4") || "5x5";
  const winCheck = checkCardWinCondition(allSquares, cardSize);

  let isWin = false;
  let winType = null;

  if (winCheck.isWin && !square.card.isCompleted) {
    isWin = true;
    winType = winCheck.winType;
    await prisma.card.update({
      where: { id: square.card.id },
      data: {
        isCompleted: true,
        completedAt: now,
        winningLineType: winType,
      },
    });
  }

  return {
    square: updatedSquare,
    isWin,
    winType,
  };
}

/**
 * Server-authoritative handshake evaluation.
 * Finds candidate matching squares for both players.
 * If 1 match -> auto-claims that 1 square.
 * If 2+ matches -> returns candidate list so player can choose 1 square.
 * Strictly enforces that ONE person only claims ONE square per card.
 */
export async function executeHandshakeEvaluation(
  eventId: string,
  playerAId: string,
  playerBId: string
) {
  // 1. Fetch both players and their survey responses and cards
  const [playerA, playerB] = await Promise.all([
    prisma.player.findUnique({
      where: { id: playerAId },
      include: {
        surveyResponses: true,
        card: { include: { squares: true } },
      },
    }),
    prisma.player.findUnique({
      where: { id: playerBId },
      include: {
        surveyResponses: true,
        card: { include: { squares: true } },
      },
    }),
  ]);

  if (!playerA || !playerB) {
    throw new Error("One or both players not found");
  }

  if (playerA.eventId !== eventId || playerB.eventId !== eventId) {
    throw new Error("Players belong to different events");
  }

  // Extract traits
  const traitsA = new Set(
    playerA.surveyResponses.map((r) => `${r.questionId}::${r.selectedOption}`)
  );
  const traitsB = new Set(
    playerB.surveyResponses.map((r) => `${r.questionId}::${r.selectedOption}`)
  );

  const now = new Date();

  // Check if Player B already stamped a square on Player A's card
  const alreadyStampedA = playerA.card?.squares.some(
    (sq) => sq.matchedPlayerId === playerB.id
  );

  // Find candidate matches for Player A from Player B's traits
  const candidateSquaresA: {
    id: string;
    position: number;
    promptText: string;
    conversationPrompt: string | null;
  }[] = [];

  if (playerA.card && !alreadyStampedA) {
    for (const sq of playerA.card.squares) {
      if (!sq.isCompleted && traitsB.has(sq.traitId)) {
        candidateSquaresA.push({
          id: sq.id,
          position: sq.position,
          promptText: sq.promptText,
          conversationPrompt: sq.conversationPrompt,
        });
      }
    }
  }

  // Check if Player A already stamped a square on Player B's card
  const alreadyStampedB = playerB.card?.squares.some(
    (sq) => sq.matchedPlayerId === playerA.id
  );

  // Find candidate matches for Player B from Player A's traits
  const candidateSquaresB: {
    id: string;
    position: number;
    promptText: string;
    conversationPrompt: string | null;
  }[] = [];

  if (playerB.card && !alreadyStampedB) {
    for (const sq of playerB.card.squares) {
      if (!sq.isCompleted && traitsA.has(sq.traitId)) {
        candidateSquaresB.push({
          id: sq.id,
          position: sq.position,
          promptText: sq.promptText,
          conversationPrompt: sq.conversationPrompt,
        });
      }
    }
  }

  // If Player A has exactly 1 candidate, auto-claim it!
  let autoClaimedA: any = null;
  if (candidateSquaresA.length === 1) {
    const claimRes = await claimSquareSelection(
      playerA.id,
      candidateSquaresA[0].id,
      playerB.id,
      playerB.displayName
    );
    autoClaimedA = claimRes.square;
  }

  // If Player B has exactly 1 candidate, auto-claim it!
  let autoClaimedB: any = null;
  if (candidateSquaresB.length === 1) {
    const claimRes = await claimSquareSelection(
      playerB.id,
      candidateSquaresB[0].id,
      playerA.id,
      playerA.displayName
    );
    autoClaimedB = claimRes.square;
  }

  // Create Connection record (pairKey ensures uniqueness per pair per event)
  const pairKey =
    playerA.id < playerB.id
      ? `${playerA.id}:${playerB.id}`
      : `${playerB.id}:${playerA.id}`;

  const connection = await prisma.connection.upsert({
    where: {
      eventId_pairKey: {
        eventId,
        pairKey,
      },
    },
    update: {
      squaresSatisfiedA: autoClaimedA ? 1 : candidateSquaresA.length > 0 ? 1 : 0,
      squaresSatisfiedB: autoClaimedB ? 1 : candidateSquaresB.length > 0 ? 1 : 0,
    },
    create: {
      eventId,
      playerAId: playerA.id,
      playerBId: playerB.id,
      pairKey,
      squaresSatisfiedA: autoClaimedA ? 1 : candidateSquaresA.length > 0 ? 1 : 0,
      squaresSatisfiedB: autoClaimedB ? 1 : candidateSquaresB.length > 0 ? 1 : 0,
      confirmedAt: now,
    },
  });

  return {
    connection,
    playerA: {
      id: playerA.id,
      name: playerA.displayName,
      candidateSquares: candidateSquaresA,
      autoClaimedSquare: autoClaimedA,
      requiresSelection: candidateSquaresA.length > 1,
    },
    playerB: {
      id: playerB.id,
      name: playerB.displayName,
      candidateSquares: candidateSquaresB,
      autoClaimedSquare: autoClaimedB,
      requiresSelection: candidateSquaresB.length > 1,
    },
  };
}

/**
 * Computes the live leaderboard with PRD-compliant tiebreakers.
 */
export async function getLiveLeaderboard(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return [];

  const players = await prisma.player.findMany({
    where: { eventId },
    include: {
      card: {
        include: {
          squares: true,
        },
      },
      initiatedConnections: true,
      receivedConnections: true,
    },
  });

  const leaderboard = players.map((p) => {
    const totalConnections =
      p.initiatedConnections.length + p.receivedConnections.length;

    const completedSquares =
      p.card?.squares.filter((sq) => sq.isCompleted && !sq.isFreeSpace) || [];
    const completedSquaresCount = completedSquares.length;

    // Distinct trait count for tiebreaker
    const distinctTraitsCount = new Set(
      completedSquares.map((sq) => sq.traitId)
    ).size;

    // Last scoring timestamp
    let lastScoredAt: Date = p.checkedInAt;
    for (const sq of completedSquares) {
      if (sq.completedAt && sq.completedAt > lastScoredAt) {
        lastScoredAt = sq.completedAt;
      }
    }

    return {
      playerId: p.id,
      displayName: p.displayName,
      shortCode: p.shortCode,
      connectionsCount: totalConnections,
      completedSquaresCount,
      distinctTraitsCount,
      isCardCompleted: p.card?.isCompleted || false,
      cardCompletedAt: p.card?.completedAt || null,
      lastScoredAt,
      checkedInAt: p.checkedInAt,
    };
  });

  if (event.scoringModel === "FIRST_TO_COMPLETE") {
    // Sort by card completion first, then completed squares, then earlier timestamps
    leaderboard.sort((a, b) => {
      if (a.isCardCompleted && !b.isCardCompleted) return -1;
      if (!a.isCardCompleted && b.isCardCompleted) return 1;
      if (a.isCardCompleted && b.isCardCompleted) {
        return (
          (a.cardCompletedAt?.getTime() || 0) -
          (b.cardCompletedAt?.getTime() || 0)
        );
      }
      if (b.completedSquaresCount !== a.completedSquaresCount) {
        return b.completedSquaresCount - a.completedSquaresCount;
      }
      // Tiebreaker 1: earlier lastScoredAt
      if (a.lastScoredAt.getTime() !== b.lastScoredAt.getTime()) {
        return a.lastScoredAt.getTime() - b.lastScoredAt.getTime();
      }
      // Tiebreaker 2: distinct traits
      if (b.distinctTraitsCount !== a.distinctTraitsCount) {
        return b.distinctTraitsCount - a.distinctTraitsCount;
      }
      // Tiebreaker 3: checkedInAt
      return a.checkedInAt.getTime() - b.checkedInAt.getTime();
    });
  } else {
    // Default: "MOST_CONNECTIONS" (or most squares filled)
    leaderboard.sort((a, b) => {
      // Primary: total verified connections (or squares completed)
      if (b.connectionsCount !== a.connectionsCount) {
        return b.connectionsCount - a.connectionsCount;
      }
      if (b.completedSquaresCount !== a.completedSquaresCount) {
        return b.completedSquaresCount - a.completedSquaresCount;
      }
      // Tiebreaker 1: earlier timestamp to reach score
      if (a.lastScoredAt.getTime() !== b.lastScoredAt.getTime()) {
        return a.lastScoredAt.getTime() - b.lastScoredAt.getTime();
      }
      // Tiebreaker 2: trait diversity
      if (b.distinctTraitsCount !== a.distinctTraitsCount) {
        return b.distinctTraitsCount - a.distinctTraitsCount;
      }
      // Tiebreaker 3: earliest check-in time
      return a.checkedInAt.getTime() - b.checkedInAt.getTime();
    });
  }

  return leaderboard.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));
}
