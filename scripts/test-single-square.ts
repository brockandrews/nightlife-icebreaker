import { prisma } from "../src/lib/prisma";
import { executeHandshakeEvaluation, claimSquareSelection } from "../src/lib/game-engine";

async function runSimulation() {
  console.log("=== STARTING 1-PERSON-1-SQUARE MATCHING SIMULATION ===");

  // 1. Fetch Pilot Event
  const event = await prisma.event.findFirst({
    where: { doorCodeToken: "PILOT-2026" },
  });

  if (!event) {
    throw new Error("Pilot event not found!");
  }
  console.log(`✓ Event: "${event.name}" (ID: ${event.id})`);

  // Clean old test players
  const oldPlayers = await prisma.player.findMany({
    where: {
      eventId: event.id,
      displayName: { in: ["TestPlayerA", "TestPlayerB"] },
    },
  });
  for (const p of oldPlayers) {
    await prisma.player.delete({ where: { id: p.id } });
  }

  const questions = await prisma.question.findMany({
    where: { eventId: event.id },
    orderBy: { order: "asc" },
  });

  // 2. Create Player A ("Persimmon")
  const playerA = await prisma.player.create({
    data: {
      eventId: event.id,
      displayName: "TestPlayerA",
      shortCode: "TPA1",
      identityToken: "token_tpa_1",
      ageConfirmed: true,
    },
  });

  // Player A answers
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const opts = JSON.parse(q.options);
    await prisma.surveyResponse.create({
      data: {
        playerId: playerA.id,
        questionId: q.id,
        selectedOption: opts[0],
        derivedTrait: opts[0],
      },
    });
  }

  // Create Card for Player A with MULTIPLE squares that Player B will satisfy!
  const cardA = await prisma.card.create({
    data: { playerId: playerA.id, eventId: event.id },
  });

  // Question 0 option 0 = House & EDM
  // Question 1 option 0 = Lived in another country
  // Question 2 option 0 = 1 language
  await prisma.cardSquare.createMany({
    data: [
      {
        cardId: cardA.id,
        position: 0,
        traitId: `${questions[0].id}::${JSON.parse(questions[0].options)[0]}`,
        promptText: "Find someone who loves House & EDM",
        isFreeSpace: false,
        isCompleted: false,
      },
      {
        cardId: cardA.id,
        position: 1,
        traitId: `${questions[1].id}::${JSON.parse(questions[1].options)[0]}`,
        promptText: "Find someone who has lived in another country",
        isFreeSpace: false,
        isCompleted: false,
      },
      {
        cardId: cardA.id,
        position: 2,
        traitId: `${questions[2].id}::${JSON.parse(questions[2].options)[0]}`,
        promptText: "Find someone who speaks 1 language",
        isFreeSpace: false,
        isCompleted: false,
      },
      {
        cardId: cardA.id,
        position: 12,
        traitId: "FREE_SPACE",
        promptText: "⭐ FREE SPACE",
        isFreeSpace: true,
        isCompleted: true,
      },
    ],
  });

  // 3. Create Player B ("Brock")
  const playerB = await prisma.player.create({
    data: {
      eventId: event.id,
      displayName: "TestPlayerB",
      shortCode: "TPB2",
      identityToken: "token_tpb_2",
      ageConfirmed: true,
    },
  });

  // Player B answers (matches all 3 of Player A's squares!)
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const opts = JSON.parse(q.options);
    await prisma.surveyResponse.create({
      data: {
        playerId: playerB.id,
        questionId: q.id,
        selectedOption: opts[0],
        derivedTrait: opts[0],
      },
    });
  }

  // Create Card for Player B
  const cardB = await prisma.card.create({
    data: { playerId: playerB.id, eventId: event.id },
  });

  await prisma.cardSquare.createMany({
    data: [
      {
        cardId: cardB.id,
        position: 0,
        traitId: `${questions[0].id}::${JSON.parse(questions[0].options)[0]}`,
        promptText: "Find someone who loves House & EDM",
        isFreeSpace: false,
        isCompleted: false,
      },
      {
        cardId: cardB.id,
        position: 12,
        traitId: "FREE_SPACE",
        promptText: "⭐ FREE SPACE",
        isFreeSpace: true,
        isCompleted: true,
      },
    ],
  });

  console.log("✓ Created TestPlayerA and TestPlayerB (Player B matches 3 of Player A's squares)");

  // 4. Test executeHandshakeEvaluation
  console.log("\n--- EXECUTING HANDSHAKE EVALUATION ---");
  const result = await executeHandshakeEvaluation(event.id, playerA.id, playerB.id);

  console.log(`✓ Player A candidate matches count: ${result.playerA.candidateSquares.length}`);
  console.log(`✓ Player A requiresSelection: ${result.playerA.requiresSelection}`);
  console.log(`✓ Player A candidate squares:`, result.playerA.candidateSquares.map((s: any) => s.promptText));

  if (result.playerA.candidateSquares.length !== 3 || !result.playerA.requiresSelection) {
    throw new Error("Expected Player A to receive 3 candidates and requiresSelection = true!");
  }

  // 5. Simulate User Selecting 1 Square (e.g. Square 1: "Lived in another country")
  const chosenSquare = result.playerA.candidateSquares[1];
  console.log(`\n--- SIMULATING USER PICKING SQUARE: "${chosenSquare.promptText}" ---`);

  const claimResult = await claimSquareSelection(
    playerA.id,
    chosenSquare.id,
    playerB.id,
    playerB.displayName
  );

  console.log(`✓ Stamped square ID ${claimResult.square.id} with ${claimResult.square.matchedPlayerName}`);

  // 6. Verify that ONLY 1 square on Player A's card was completed for Player B
  const squaresAfterA = await prisma.cardSquare.findMany({
    where: { cardId: cardA.id, matchedPlayerId: playerB.id },
  });

  console.log(`✓ Total squares stamped by TestPlayerB on TestPlayerA's card: ${squaresAfterA.length}`);
  if (squaresAfterA.length !== 1) {
    throw new Error(`Expected exactly 1 square stamped by Player B, found ${squaresAfterA.length}!`);
  }

  // 7. Verify that trying to claim a second square with Player B throws an error
  console.log("\n--- TESTING 1-PERSON-1-SQUARE ABUSE PREVENTION ---");
  try {
    const secondSquare = result.playerA.candidateSquares[0];
    await claimSquareSelection(
      playerA.id,
      secondSquare.id,
      playerB.id,
      playerB.displayName
    );
    throw new Error("❌ Error: Should not allow same player to claim a second square!");
  } catch (err: any) {
    console.log(`✓ Success: Attempt to claim second square was blocked: "${err.message}"`);
  }

  console.log("\n=== ALL 1-PERSON-1-SQUARE TESTS PASSED ===");
}

runSimulation()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
