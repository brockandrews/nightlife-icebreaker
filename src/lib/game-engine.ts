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
    const low = v.toLowerCase();

    // Travel
    if (low.startsWith("lived") || low.startsWith("backpacked") || low.startsWith("taken") || low.startsWith("island")) {
      return `Find someone who has ${low}`;
    }
    if (low.startsWith("prefers")) {
      return `Find someone who ${low}`;
    }

    // Roots
    if (low.startsWith("born") || low.startsWith("visiting")) {
      return `Find someone who is ${low}`;
    }
    if (low.startsWith("recent transplant")) {
      return `Find someone who is a recent transplant`;
    }
    if (low.startsWith("moved")) {
      return `Find someone who ${low}`;
    }

    // Vibe
    if (low.startsWith("center")) {
      return `Find someone who loves the center of the dance floor`;
    }
    if (low.startsWith("lounge")) {
      return `Find someone who loves the lounge corner & deep talks`;
    }
    if (low.startsWith("floating")) {
      return `Find someone who is floating between all groups`;
    }
    if (low.startsWith("checking")) {
      return `Find someone who is checking out the DJ gear`;
    }

    // Quirks
    if (low.startsWith("can dj") || low.startsWith("cooks")) {
      return `Find someone who ${low}`;
    }
    if (low.startsWith("fitness")) {
      return `Find someone who is a ${low}`;
    }
    if (low.startsWith("astrology") || low.startsWith("insane")) {
      return `Find someone who is an ${low}`;
    }

    return `Find someone who ${low}`;
  }

  const raw = template.replace("{value}", value).trim();
  if (raw.toLowerCase().startsWith("find someone who")) {
    return raw;
  }
  return `Find someone who ${raw.toLowerCase()}`;
}

/**
 * Resolves or repairs a suggested conversation icebreaker prompt
 * for a square, handling option-specific questions (e.g. 1 language vs bilingual vs polyglot).
 */
export function resolveConversationPrompt(
  category?: string | null,
  optionOrTraitId?: string | null,
  promptText?: string | null,
  existingPrompt?: string | null
): string {
  const combined = `${category || ""} ${optionOrTraitId || ""} ${promptText || ""}`.toLowerCase();

  // Language square option-specific questions
  if (combined.includes("language") || combined.includes("polyglot") || combined.includes("bilingual")) {
    if (combined.includes("1 language") || combined.includes("english")) {
      return "Ask them what country they'd move to tomorrow if they could instantly speak the language!";
    }
    if (combined.includes("2 languages") || combined.includes("bilingual")) {
      return "Ask them what other language they speak and how to say 'Cheers!'";
    }
    if (combined.includes("3+") || combined.includes("polyglot")) {
      return "Ask them which languages they speak and to teach you how to say 'Cheers!' in their favorite one!";
    }
  }

  // Travel square specifics
  if (combined.includes("close to home")) {
    return "Ask them what their dream vacation would be if money was no object!";
  }

  if (existingPrompt && existingPrompt.trim()) {
    return existingPrompt;
  }

  return "Say hi and ask what brought them here tonight!";
}

/**
 * Template matrices mapping non-free square positions to balanced category indices (0..7).
 * Mathematically guaranteed:
 * - 5x5: exactly 3 squares per category (24 squares total), 0 category collisions on any row or col.
 * - 4x4: exactly 2 squares per category (16 squares total), 0 category collisions on any row or col.
 */
const BALANCED_5X5_CATEGORIES = [
  // Row 0 (pos 0-4)
  0, 3, 6, 1, 4,
  // Row 1 (pos 5-9)
  7, 2, 5, 0, 3,
  // Row 2 (pos 10-11, [12 FREE], 13-14)
  6, 1, /* FREE SPACE */ 4, 7,
  // Row 3 (pos 15-19)
  2, 5, 0, 3, 6,
  // Row 4 (pos 20-24)
  1, 4, 7, 2, 5,
];

const BALANCED_4X4_CATEGORIES = [
  // Row 0 (pos 0-3)
  0, 1, 2, 3,
  // Row 1 (pos 4-7)
  4, 5, 6, 7,
  // Row 2 (pos 8-11)
  3, 2, 1, 0,
  // Row 3 (pos 12-15)
  5, 4, 7, 6,
];

/**
 * Generates a balanced, multi-category, pool-aware bingo card for a newly registered player.
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

  // Fetch all questions and traits pinned to this event
  let questions = await prisma.question.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
  });

  if (questions.length === 0) {
    questions = await prisma.question.findMany({
      where: {
        OR: [{ eventId }, { eventId: null }],
      },
      orderBy: { order: "asc" },
    });
  }

  // Fetch attendee survey responses for pool-aware feasibility weighting (PRD §5.7)
  const attendeeResponses = await prisma.surveyResponse.findMany({
    where: { player: { eventId } },
    select: { questionId: true, selectedOption: true },
  });

  // Count active holders in the room per trait
  const roomTraitCounts = new Map<string, number>();
  for (const r of attendeeResponses) {
    const key = `${r.questionId}::${r.selectedOption}`;
    roomTraitCounts.set(key, (roomTraitCounts.get(key) || 0) + 1);
  }

  const is5x5 = cardSize === "5x5";
  const totalSquares = is5x5 ? 25 : 16;
  const freePosition = is5x5 ? 12 : -1;
  const traitsPerCategory = is5x5 ? 3 : 2;

  // Permute questions so each player receives a unique mapping of categories
  const permutedQuestions = shuffleArray([...questions]);

  // For each question/category, pick exactly `traitsPerCategory` distinct traits,
  // prioritizing options that active attendees in the room actually hold (pool awareness)
  const categoryTraitBuckets: Map<number, TraitDefinition[]> = new Map();

  for (let qIdx = 0; qIdx < permutedQuestions.length; qIdx++) {
    const q = permutedQuestions[qIdx];
    let options: string[] = [];
    try {
      options = JSON.parse(q.options);
    } catch {
      options = [];
    }

    // Separate options into Active (held by >= 1 attendee) and Others (0 holders yet)
    const activeOptions = options.filter(
      (opt) => (roomTraitCounts.get(`${q.id}::${opt}`) || 0) > 0
    );
    const otherOptions = options.filter(
      (opt) => (roomTraitCounts.get(`${q.id}::${opt}`) || 0) === 0
    );

    const shuffledActive = shuffleArray(activeOptions);
    const shuffledOthers = shuffleArray(otherOptions);

    // Pick distinct options for this category: blend active options with others
    const selectedOptions: string[] = [];

    // Prioritize at least 1-2 active traits if available in the room
    while (
      selectedOptions.length < traitsPerCategory &&
      shuffledActive.length > 0
    ) {
      selectedOptions.push(shuffledActive.pop()!);
    }

    // Fill remaining slots with other options
    while (
      selectedOptions.length < traitsPerCategory &&
      shuffledOthers.length > 0
    ) {
      selectedOptions.push(shuffledOthers.pop()!);
    }

    // If options were fewer than required, fallback to any available option
    if (selectedOptions.length < traitsPerCategory) {
      for (const opt of options) {
        if (!selectedOptions.includes(opt)) {
          selectedOptions.push(opt);
          if (selectedOptions.length >= traitsPerCategory) break;
        }
      }
    }

    // Build TraitDefinition objects for selected options
    const traits: TraitDefinition[] = selectedOptions.map((opt) => {
      const promptText = formatPromptText(q.traitTemplate, opt);
      const conversationPrompt = resolveConversationPrompt(
        q.category,
        opt,
        promptText,
        q.conversationPrompt ? q.conversationPrompt.replace("{value}", opt) : null
      );

      return {
        id: `${q.id}::${opt}`,
        category: q.category,
        promptText,
        conversationPrompt,
      };
    });

    categoryTraitBuckets.set(qIdx, traits);
  }

  // Create the Card record
  const card = await prisma.card.create({
    data: {
      playerId,
      eventId,
      isCompleted: false,
    },
  });

  // Assign squares using the balanced category template matrices
  const squareCreates = [];
  let nonFreeIndex = 0;

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
      // Determine category index for this position
      let categoryIndex = 0;
      if (is5x5) {
        const templateCat = BALANCED_5X5_CATEGORIES[nonFreeIndex % BALANCED_5X5_CATEGORIES.length];
        categoryIndex = templateCat % permutedQuestions.length;
      } else {
        const templateCat = BALANCED_4X4_CATEGORIES[pos % BALANCED_4X4_CATEGORIES.length];
        categoryIndex = templateCat % permutedQuestions.length;
      }

      // Pop a trait from this category bucket
      const bucket = categoryTraitBuckets.get(categoryIndex) || [];
      const trait = bucket.pop();

      squareCreates.push({
        cardId: card.id,
        position: pos,
        traitId: trait ? trait.id : `DEFAULT_${pos}`,
        promptText: trait ? trait.promptText : "Find someone who loves nightlife!",
        conversationPrompt: trait ? trait.conversationPrompt : "Ask them what brought them here tonight!",
        isFreeSpace: false,
        isCompleted: false,
      });

      nonFreeIndex++;
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

export interface WinConditionResult {
  isWin: boolean;
  winType: string | null;
  completedLinesCount: number;
  completedLineTypes: string[];
  isBlackout: boolean;
  nearLineCount: number;
  nearLineSquares: number[];
}

/**
 * Checks multi-line win conditions, completed lines, and 1-away tension squares on a card.
 */
export function checkCardWinCondition(
  squares: { position: number; isCompleted: boolean; isFreeSpace?: boolean }[],
  cardSize: string = "5x5"
): WinConditionResult {
  const size = cardSize === "4x4" ? 4 : 5;
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

  const completedLineTypes: string[] = [];
  const nearLineSquaresSet = new Set<number>();
  let nearLineCount = 0;

  // 1. Check Rows
  for (let r = 0; r < size; r++) {
    const rowSquares = grid[r];
    const completedCount = rowSquares.filter(Boolean).length;
    if (completedCount === size) {
      completedLineTypes.push(`ROW_${r + 1}`);
    } else if (completedCount === size - 1) {
      nearLineCount++;
      const missingCol = rowSquares.findIndex((c) => !c);
      if (missingCol !== -1) {
        nearLineSquaresSet.add(r * size + missingCol);
      }
    }
  }

  // 2. Check Columns
  for (let c = 0; c < size; c++) {
    let colCompletedCount = 0;
    let missingRow = -1;
    for (let r = 0; r < size; r++) {
      if (grid[r][c]) {
        colCompletedCount++;
      } else {
        missingRow = r;
      }
    }
    if (colCompletedCount === size) {
      completedLineTypes.push(`COL_${c + 1}`);
    } else if (colCompletedCount === size - 1 && missingRow !== -1) {
      nearLineCount++;
      nearLineSquaresSet.add(missingRow * size + c);
    }
  }

  // 3. Check Main Diagonal (\)
  let diag1Count = 0;
  let missingDiag1 = -1;
  for (let i = 0; i < size; i++) {
    if (grid[i][i]) {
      diag1Count++;
    } else {
      missingDiag1 = i;
    }
  }
  if (diag1Count === size) {
    completedLineTypes.push("DIAGONAL_MAIN");
  } else if (diag1Count === size - 1 && missingDiag1 !== -1) {
    nearLineCount++;
    nearLineSquaresSet.add(missingDiag1 * size + missingDiag1);
  }

  // 4. Check Anti Diagonal (/)
  let diag2Count = 0;
  let missingDiag2 = -1;
  for (let i = 0; i < size; i++) {
    const col = size - 1 - i;
    if (grid[i][col]) {
      diag2Count++;
    } else {
      missingDiag2 = i;
    }
  }
  if (diag2Count === size) {
    completedLineTypes.push("DIAGONAL_ANTI");
  } else if (diag2Count === size - 1 && missingDiag2 !== -1) {
    nearLineCount++;
    nearLineSquaresSet.add(missingDiag2 * size + (size - 1 - missingDiag2));
  }

  // 5. Check Blackout
  const allCompleted = squares.every((s) => s.isCompleted);
  const isBlackout = allCompleted;

  const completedLinesCount = completedLineTypes.length;
  let winType: string | null = null;

  if (isBlackout) {
    winType = "BLACKOUT";
  } else if (completedLinesCount >= 3) {
    winType = `MULTI_LINE_${completedLinesCount}`;
  } else if (completedLinesCount === 2) {
    winType = "TWO_LINES";
  } else if (completedLinesCount === 1) {
    winType = completedLineTypes[0];
  }

  return {
    isWin: completedLinesCount > 0 || isBlackout,
    winType,
    completedLinesCount,
    completedLineTypes,
    isBlackout,
    nearLineCount,
    nearLineSquares: Array.from(nearLineSquaresSet),
  };
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

  if (winCheck.isWin) {
    isWin = true;
    winType = winCheck.winType;
    await prisma.card.update({
      where: { id: square.card.id },
      data: {
        isCompleted: true,
        completedAt: square.card.isCompleted ? square.card.completedAt : now,
        winningLineType: winType,
      },
    });
  }

  return {
    square: updatedSquare,
    isWin,
    winType,
    completedLinesCount: winCheck.completedLinesCount,
    completedLineTypes: winCheck.completedLineTypes,
    nearLineCount: winCheck.nearLineCount,
    nearLineSquares: winCheck.nearLineSquares,
    isBlackout: winCheck.isBlackout,
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
          conversationPrompt: resolveConversationPrompt(
            null,
            sq.traitId,
            sq.promptText,
            sq.conversationPrompt
          ),
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
          conversationPrompt: resolveConversationPrompt(
            null,
            sq.traitId,
            sq.promptText,
            sq.conversationPrompt
          ),
        });
      }
    }
  }

  // Pick exactly ONE random available candidate square for Player A (if any match)
  const singleCandidateA: typeof candidateSquaresA = [];
  if (candidateSquaresA.length > 0) {
    const randomIndexA = Math.floor(Math.random() * candidateSquaresA.length);
    singleCandidateA.push(candidateSquaresA[randomIndexA]);
  }

  // Pick exactly ONE random available candidate square for Player B (if any match)
  const singleCandidateB: typeof candidateSquaresB = [];
  if (candidateSquaresB.length > 0) {
    const randomIndexB = Math.floor(Math.random() * candidateSquaresB.length);
    singleCandidateB.push(candidateSquaresB[randomIndexB]);
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
      squaresSatisfiedA: singleCandidateA.length > 0 ? 1 : 0,
      squaresSatisfiedB: singleCandidateB.length > 0 ? 1 : 0,
    },
    create: {
      eventId,
      playerAId: playerA.id,
      playerBId: playerB.id,
      pairKey,
      squaresSatisfiedA: singleCandidateA.length > 0 ? 1 : 0,
      squaresSatisfiedB: singleCandidateB.length > 0 ? 1 : 0,
      confirmedAt: now,
    },
  });

  return {
    connection,
    playerA: {
      id: playerA.id,
      name: playerA.displayName,
      candidateSquares: singleCandidateA,
      autoClaimedSquare: null,
      requiresSelection: singleCandidateA.length > 0,
    },
    playerB: {
      id: playerB.id,
      name: playerB.displayName,
      candidateSquares: singleCandidateB,
      autoClaimedSquare: null,
      requiresSelection: singleCandidateB.length > 0,
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

/**
 * Swaps an unfillable or impossible square on a player's card for an active trait (PRD §5.7).
 * Strictly preserves card balance and never duplicates an existing trait on the card.
 */
export async function swapUnfillableSquare(playerId: string, squareId: string) {
  const square = await prisma.cardSquare.findUnique({
    where: { id: squareId },
    include: {
      card: {
        include: {
          event: true,
          squares: true,
        },
      },
    },
  });

  if (!square) {
    throw new Error("Square not found");
  }

  if (square.card.playerId !== playerId) {
    throw new Error("Unauthorized: Square does not belong to this player");
  }

  if (square.isCompleted) {
    throw new Error("Completed squares cannot be swapped");
  }

  if (square.isFreeSpace) {
    throw new Error("Free space cannot be swapped");
  }

  const eventId = square.card.eventId;

  // Find all traits answered by attendees in this event
  const attendeeResponses = await prisma.surveyResponse.findMany({
    where: { player: { eventId } },
    select: { questionId: true, selectedOption: true },
  });

  const existingCardTraitIds = new Set(square.card.squares.map((s) => s.traitId));
  const [currentQuestionId] = square.traitId.split("::");

  // 1. Prioritize finding an alternate option from the SAME question that has active holders in the room
  const sameQuestionCandidates = attendeeResponses.filter(
    (r) =>
      r.questionId === currentQuestionId &&
      !existingCardTraitIds.has(`${r.questionId}::${r.selectedOption}`)
  );

  let replacement: { questionId: string; selectedOption: string } | null = null;

  if (sameQuestionCandidates.length > 0) {
    const pick =
      sameQuestionCandidates[
        Math.floor(Math.random() * sameQuestionCandidates.length)
      ];
    replacement = {
      questionId: pick.questionId,
      selectedOption: pick.selectedOption,
    };
  } else {
    // 2. Fallback: find any active trait from another question held by attendees in the room
    const otherCandidates = attendeeResponses.filter(
      (r) =>
        !existingCardTraitIds.has(`${r.questionId}::${r.selectedOption}`)
    );

    if (otherCandidates.length > 0) {
      const pick =
        otherCandidates[Math.floor(Math.random() * otherCandidates.length)];
      replacement = {
        questionId: pick.questionId,
        selectedOption: pick.selectedOption,
      };
    }
  }

  // 3. Last resort fallback: find any unused option from the question template
  if (!replacement) {
    const question = await prisma.question.findUnique({
      where: { id: currentQuestionId },
    });
    if (question) {
      let opts: string[] = [];
      try {
        opts = JSON.parse(question.options);
      } catch {
        opts = [];
      }
      const unusedOpts = opts.filter(
        (o) => !existingCardTraitIds.has(`${question.id}::${o}`)
      );
      if (unusedOpts.length > 0) {
        replacement = {
          questionId: question.id,
          selectedOption: unusedOpts[0],
        };
      }
    }
  }

  if (!replacement) {
    throw new Error("No eligible replacement challenge found for this square");
  }

  const question = await prisma.question.findUnique({
    where: { id: replacement.questionId },
  });

  if (!question) {
    throw new Error("Question definition not found");
  }

  const newTraitId = `${replacement.questionId}::${replacement.selectedOption}`;
  const newPromptText = formatPromptText(
    question.traitTemplate,
    replacement.selectedOption
  );
  const newConversationPrompt = resolveConversationPrompt(
    question.category,
    replacement.selectedOption,
    newPromptText,
    question.conversationPrompt
      ? question.conversationPrompt.replace("{value}", replacement.selectedOption)
      : null
  );

  const updatedSquare = await prisma.cardSquare.update({
    where: { id: squareId },
    data: {
      traitId: newTraitId,
      promptText: newPromptText,
      conversationPrompt: newConversationPrompt,
    },
  });

  return {
    success: true,
    square: updatedSquare,
    message: `Square swapped to: "${newPromptText}"`,
  };
}

/**
 * Computes live room trait heat and category distribution for the host console (PRD §6.5).
 */
export async function computeTraitHeat(eventId: string) {
  const [questions, responses, stampedSquares, totalPlayers] =
    await Promise.all([
      prisma.question.findMany({
        where: { eventId },
        orderBy: { order: "asc" },
      }),
      prisma.surveyResponse.findMany({
        where: { player: { eventId } },
        select: { questionId: true, selectedOption: true },
      }),
      prisma.cardSquare.findMany({
        where: {
          card: { eventId },
          isCompleted: true,
          isFreeSpace: false,
        },
        select: { traitId: true },
      }),
      prisma.player.count({ where: { eventId } }),
    ]);

  // Count active attendees who hold each trait
  const holderCounts = new Map<string, number>();
  for (const r of responses) {
    const key = `${r.questionId}::${r.selectedOption}`;
    holderCounts.set(key, (holderCounts.get(key) || 0) + 1);
  }

  // Count how many times each trait was stamped
  const stampCounts = new Map<string, number>();
  for (const s of stampedSquares) {
    stampCounts.set(s.traitId, (stampCounts.get(s.traitId) || 0) + 1);
  }

  const categoryHeat = questions.map((q) => {
    let options: string[] = [];
    try {
      options = JSON.parse(q.options);
    } catch {
      options = [];
    }

    const traits = options.map((opt) => {
      const traitKey = `${q.id}::${opt}`;
      const holders = holderCounts.get(traitKey) || 0;
      const stamps = stampCounts.get(traitKey) || 0;
      const promptText = formatPromptText(q.traitTemplate, opt);

      // Hot if held by >= 20% of players (min 2), Cold if 0 holders or only 1 when >= 4 players
      const isHot =
        totalPlayers >= 3 &&
        holders >= Math.max(2, Math.round(totalPlayers * 0.2));
      const isCold = (totalPlayers >= 4 && holders <= 1) || holders === 0;

      return {
        traitId: traitKey,
        option: opt,
        promptText,
        holdersCount: holders,
        stampedCount: stamps,
        isHot,
        isCold,
      };
    });

    return {
      questionId: q.id,
      category: q.category,
      prompt: q.prompt,
      traits,
    };
  });

  return categoryHeat;
}
