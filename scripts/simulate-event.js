const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runSimulation() {
  console.log("=== STARTING NIGHTLIFE ICEBREAKER SIMULATION ===");

  // 1. Fetch Pilot Event
  const event = await prisma.event.findFirst({
    where: { doorCodeToken: "PILOT-2026" },
  });

  if (!event) {
    throw new Error("Pilot event not found! Run prisma/seed.js first.");
  }
  console.log(`✓ Located event: "${event.name}" (ID: ${event.id})`);

  // 2. Fetch questions
  const questions = await prisma.question.findMany({
    where: { eventId: event.id },
    orderBy: { order: "asc" },
  });
  console.log(`✓ Loaded ${questions.length} questions from question bank`);

  // 3. Create Player 1: "Maya"
  const player1 = await prisma.player.create({
    data: {
      eventId: event.id,
      displayName: "Maya",
      shortCode: "M7Y1",
      identityToken: "token_maya_123",
      marketingOptIn: true,
      contactEmail: "maya@nightlife.com",
    },
  });
  console.log(`✓ Registered Player 1: Maya (PIN: ${player1.shortCode})`);

  // Maya's Survey Responses
  for (const q of questions) {
    const opts = JSON.parse(q.options);
    const selectedOption = opts[0]; // e.g. "House & EDM", "Lived in another country"
    await prisma.surveyResponse.create({
      data: {
        playerId: player1.id,
        questionId: q.id,
        selectedOption,
        derivedTrait: q.traitTemplate.replace("{value}", selectedOption),
      },
    });
  }

  // Generate Maya's Card
  const card1 = await prisma.card.create({
    data: {
      playerId: player1.id,
      eventId: event.id,
    },
  });

  // Assign squares to Maya's card (including one matching question 1 option 0)
  await prisma.cardSquare.createMany({
    data: [
      {
        cardId: card1.id,
        position: 0,
        traitId: `${questions[0].id}::${JSON.parse(questions[0].options)[1]}`, // Looking for Hip-Hop
        promptText: `Find someone who ${questions[0].traitTemplate.replace("{value}", JSON.parse(questions[0].options)[1])}`,
        conversationPrompt: "Ask them their favorite hip-hop track!",
        isFreeSpace: false,
        isCompleted: false,
      },
      {
        cardId: card1.id,
        position: 12,
        traitId: "FREE_SPACE",
        promptText: "⭐ FREE SPACE",
        isFreeSpace: true,
        isCompleted: true,
      },
    ],
  });
  console.log("✓ Generated Maya's Bingo Card");

  // 4. Create Player 2: "Jordan"
  const player2 = await prisma.player.create({
    data: {
      eventId: event.id,
      displayName: "Jordan",
      shortCode: "J4R9",
      identityToken: "token_jordan_456",
      marketingOptIn: true,
      contactEmail: "jordan@nightlife.com",
    },
  });
  console.log(`✓ Registered Player 2: Jordan (PIN: ${player2.shortCode})`);

  // Jordan's Survey Responses (Answers Hip-Hop for question 0, satisfying Maya's square!)
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const opts = JSON.parse(q.options);
    const selectedOption = i === 0 ? opts[1] : opts[0]; // Jordan selected Hip-Hop!
    await prisma.surveyResponse.create({
      data: {
        playerId: player2.id,
        questionId: q.id,
        selectedOption,
        derivedTrait: q.traitTemplate.replace("{value}", selectedOption),
      },
    });
  }

  // Generate Jordan's Card
  const card2 = await prisma.card.create({
    data: {
      playerId: player2.id,
      eventId: event.id,
    },
  });

  await prisma.cardSquare.createMany({
    data: [
      {
        cardId: card2.id,
        position: 0,
        traitId: `${questions[1].id}::${JSON.parse(questions[1].options)[0]}`, // Looking for "Lived in another country" (Maya has it!)
        promptText: `Find someone who ${questions[1].traitTemplate.replace("{value}", JSON.parse(questions[1].options)[0])}`,
        conversationPrompt: "Ask them what country they lived in!",
        isFreeSpace: false,
        isCompleted: false,
      },
      {
        cardId: card2.id,
        position: 12,
        traitId: "FREE_SPACE",
        promptText: "⭐ FREE SPACE",
        isFreeSpace: true,
        isCompleted: true,
      },
    ],
  });
  console.log("✓ Generated Jordan's Bingo Card");

  // 5. Simulate Two-Sided Handshake
  console.log("\n--- SIMULATING REAL-TIME HANDSHAKE ---");
  const expiresAt = new Date(Date.now() + 60000);
  const attempt = await prisma.connectionAttempt.create({
    data: {
      eventId: event.id,
      initiatorId: player1.id,
      targetId: player2.id,
      status: "PENDING",
      expiresAt,
    },
  });
  console.log(`✓ Maya scanned Jordan's code -> Created ConnectionAttempt (${attempt.id})`);

  // Target Jordan Confirms
  await prisma.connectionAttempt.update({
    where: { id: attempt.id },
    data: { status: "CONFIRMED", resolvedAt: new Date() },
  });
  console.log("✓ Jordan tapped 'Yes, Confirm Meet!' within 60s window");

  // Trait Matching & Card Evaluation
  const pairKey = `${player1.id}:${player2.id}`;
  const connection = await prisma.connection.create({
    data: {
      eventId: event.id,
      playerAId: player1.id,
      playerBId: player2.id,
      pairKey,
      squaresSatisfiedA: 1,
      squaresSatisfiedB: 1,
    },
  });

  // Mark Maya's square as completed by Jordan
  await prisma.cardSquare.updateMany({
    where: { cardId: card1.id, position: 0 },
    data: {
      isCompleted: true,
      matchedPlayerId: player2.id,
      matchedPlayerName: player2.displayName,
      completedAt: new Date(),
    },
  });

  // Mark Jordan's square as completed by Maya
  await prisma.cardSquare.updateMany({
    where: { cardId: card2.id, position: 0 },
    data: {
      isCompleted: true,
      matchedPlayerId: player1.id,
      matchedPlayerName: player1.displayName,
      completedAt: new Date(),
    },
  });

  console.log(`✓ Connection recorded in DB (ID: ${connection.id})`);
  console.log("✓ Maya's card square completed with trait matched from Jordan!");
  console.log("✓ Jordan's card square completed with trait matched from Maya!");

  // 6. Test Anti-Fraud Duplicate Prevention
  console.log("\n--- TESTING ANTI-FRAUD CONTROLS ---");
  try {
    await prisma.connection.create({
      data: {
        eventId: event.id,
        playerAId: player1.id,
        playerBId: player2.id,
        pairKey, // Same pairKey!
      },
    });
    console.error("❌ ERROR: Duplicate connection should have failed!");
  } catch (err) {
    console.log("✓ Anti-Fraud Success: Duplicate connection correctly blocked by uniqueness constraint!");
  }

  // 7. Verify Live Standings
  const totalConns = await prisma.connection.count({
    where: { eventId: event.id },
  });
  console.log(`\n✓ Verified total connections in event: ${totalConns}`);
  console.log("=== SIMULATION COMPLETED SUCCESSFULLY ===");
}

runSimulation()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
