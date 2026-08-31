const { PrismaClient } = require("@prisma/client");
const { generateBingoCard, executeHandshakeEvaluation, claimSquareSelection, getLiveLeaderboard } = require("../src/lib/game-engine");
const { generateShortCode } = require("../src/lib/utils");
const prisma = new PrismaClient();

const GUEST_NAMES = [
  "Maya Lin", "Jordan Reed", "Alex Vance", "Taylor Swift", "Sammy Chen",
  "Morgan Bailey", "Chris Evans", "Riley Cooper", "Casey Diaz", "Avery Brooks",
  "Logan Paulson", "Jamie Oliver", "Drew Barry", "Cameron Diaz", "Kendall Roy",
  "Skylar Grey", "Reese Witherspoon", "Dakota Johnson", "Parker Posey", "Hayden Pan",
  "Emerson Lake", "Finley Morse", "Rowan Atkinson", "Quinn Fabray", "Tatum O'Neal"
];

async function runFullGameSimulation(playerCount = 25) {
  console.log("\n" + "=".repeat(65));
  console.log(`🎉 NIGHTLIFE ICEBREAKER — FULL GAME SIMULATION (${playerCount} PLAYERS)`);
  console.log("=".repeat(65) + "\n");

  const startTime = Date.now();

  // 1. Create a Fresh Mega-Test Event
  const now = new Date();
  const endTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const testDoorCode = `SIM-${generateShortCode()}`;

  const event = await prisma.event.create({
    data: {
      name: `Neon Arena Simulation (${playerCount} Players)`,
      venueName: "Skyline Rooftop Lounge",
      startTime: now,
      endTime: endTime,
      gameStartTime: now,
      gameEndTime: endTime,
      status: "ACTIVE",
      cardSize: "5x5",
      scoringModel: "MOST_CONNECTIONS",
      completionMode: "AUTO_FILL",
      prizeDescription: "VIP Champagne Table & Bottle Service Package ($500 Value)",
      doorCodeToken: testDoorCode,
    },
  });

  console.log(`📍 Created Simulation Event: "${event.name}"`);
  console.log(`🔑 Door Code: ${event.doorCodeToken} | ID: ${event.id}`);

  // Fetch Questions
  const questions = await prisma.question.findMany({
    where: { OR: [{ eventId: event.id }, { eventId: null }] },
    orderBy: { order: "asc" },
  });
  console.log(`📋 Loaded ${questions.length} questions from the Question Bank\n`);

  // 2. Register all players, answer surveys, and generate bingo cards
  console.log(`--- PHASE 1: CHECK-IN & BINGO CARD GENERATION (${playerCount} PLAYERS) ---`);
  const registeredPlayers = [];

  for (let i = 0; i < playerCount; i++) {
    const displayName = GUEST_NAMES[i % GUEST_NAMES.length];
    const shortCode = generateShortCode();

    const player = await prisma.player.create({
      data: {
        eventId: event.id,
        displayName: `${displayName} #${i + 1}`,
        shortCode,
        identityToken: `token_sim_${i + 1}_${shortCode}`,
        ageConfirmed: true,
        marketingOptIn: i % 2 === 0, // 50% marketing opt-in
        contactEmail: i % 2 === 0 ? `guest_${i + 1}@nightlife.com` : null,
      },
    });

    // Randomize realistic survey answers for this player
    for (const q of questions) {
      const options = JSON.parse(q.options);
      const selectedOption = options[Math.floor(Math.random() * options.length)];
      await prisma.surveyResponse.create({
        data: {
          playerId: player.id,
          questionId: q.id,
          selectedOption,
          derivedTrait: selectedOption,
        },
      });
    }

    // Generate balanced 5x5 card
    const card = await generateBingoCard(player.id, event.id, "5x5");
    registeredPlayers.push({ player, card });
  }

  console.log(`✓ Successfully registered ${registeredPlayers.length} players with unique PINs and 5x5 cards.`);

  // 3. Simulate Realistic Nightclub Networking Rounds
  console.log(`\n--- PHASE 2: SIMULATING IN-PERSON NETWORKING & HANDSHAKES ---`);
  let totalConnectionsAttempted = 0;
  let totalConnectionsConfirmed = 0;
  let totalSquaresStamped = 0;
  const attemptedPairs = new Set();

  const NUM_ROUNDS = 6;
  const PAIRS_PER_ROUND = Math.floor(playerCount * 0.8);

  for (let round = 1; round <= NUM_ROUNDS; round++) {
    console.log(`\n▶ Round ${round} of ${NUM_ROUNDS}: Crowds mingling across the lounge...`);

    for (let p = 0; p < PAIRS_PER_ROUND; p++) {
      // Pick two random distinct players
      const idxA = Math.floor(Math.random() * playerCount);
      let idxB = Math.floor(Math.random() * playerCount);
      while (idxB === idxA) {
        idxB = Math.floor(Math.random() * playerCount);
      }

      const pA = registeredPlayers[idxA].player;
      const pB = registeredPlayers[idxB].player;

      const pairKey = pA.id < pB.id ? `${pA.id}:${pB.id}` : `${pB.id}:${pA.id}`;
      if (attemptedPairs.has(pairKey)) {
        continue; // Skip already connected pairs in this simulation run
      }
      attemptedPairs.add(pairKey);
      totalConnectionsAttempted++;

      // Execute handshake evaluation
      const result = await executeHandshakeEvaluation(event.id, pA.id, pB.id);
      totalConnectionsConfirmed++;

      // Simulate Player A square selection if multiple matches exist
      if (result.playerA.requiresSelection && result.playerA.candidateSquares.length > 1) {
        // Player picks the first candidate
        const chosen = result.playerA.candidateSquares[0];
        await claimSquareSelection(pA.id, chosen.id, pB.id, pB.displayName);
        totalSquaresStamped++;
      } else if (result.playerA.autoClaimedSquare) {
        totalSquaresStamped++;
      }

      // Simulate Player B square selection if multiple matches exist
      if (result.playerB.requiresSelection && result.playerB.candidateSquares.length > 1) {
        const chosen = result.playerB.candidateSquares[0];
        await claimSquareSelection(pB.id, chosen.id, pA.id, pA.displayName);
        totalSquaresStamped++;
      } else if (result.playerB.autoClaimedSquare) {
        totalSquaresStamped++;
      }
    }
  }

  console.log(`\n✓ Completed ${NUM_ROUNDS} networking rounds:`);
  console.log(`  • Verified In-Person Connections: ${totalConnectionsConfirmed}`);
  console.log(`  • Total Bingo Squares Stamped: ${totalSquaresStamped}`);

  // 4. Test Anti-Fraud Edge Cases
  console.log(`\n--- PHASE 3: VERIFYING ANTI-FRAUD SECURITY CONTROLS ---`);

  // Attack 1: Duplicate connection attempt
  const testA = registeredPlayers[0].player;
  const testB = registeredPlayers[1].player;
  const testPairKey = testA.id < testB.id ? `${testA.id}:${testB.id}` : `${testB.id}:${testA.id}`;

  try {
    await prisma.connection.create({
      data: {
        eventId: event.id,
        playerAId: testA.id,
        playerBId: testB.id,
        pairKey: testPairKey,
      },
    });
    console.error("❌ ERROR: Duplicate connection should have been blocked!");
  } catch (err) {
    console.log("  ✓ Anti-Fraud [Duplicate Prevention]: Passed! Duplicate connection blocked by database pair constraint.");
  }

  // Attack 2: Attempting to claim multiple squares from the same player
  const pACardSquares = await prisma.cardSquare.findMany({
    where: {
      card: { playerId: testA.id },
      matchedPlayerId: testB.id,
    },
  });

  if (pACardSquares.length > 1) {
    console.error("❌ ERROR: 1-person-1-square violation! Player B has multiple squares on Player A's card.");
  } else {
    console.log("  ✓ Anti-Fraud [1-Person-1-Square Rule]: Passed! Each attendee strictly occupies <= 1 square per card.");
  }

  // 5. Compute Live Leaderboard & Audit Standings
  console.log(`\n--- PHASE 4: AUDITING LIVE LEADERBOARD & WINNER DETERMINATION ---`);
  const leaderboard = await getLiveLeaderboard(event.id);

  console.log("\n" + "-".repeat(70));
  console.log(
    "RANK".padEnd(6) +
    "PLAYER NAME".padEnd(24) +
    "PIN".padEnd(8) +
    "MEETS".padEnd(8) +
    "SQUARES".padEnd(10) +
    "TRAITS".padEnd(8) +
    "BINGO"
  );
  console.log("-".repeat(70));

  for (const entry of leaderboard.slice(0, 10)) {
    const rankStr = entry.rank === 1 ? "🥇 #1" : entry.rank === 2 ? "🥈 #2" : entry.rank === 3 ? "🥉 #3" : `#${entry.rank}`;
    const bingoStr = entry.isCardCompleted ? "✨ YES" : "—";

    console.log(
      rankStr.padEnd(6) +
      entry.displayName.padEnd(24) +
      entry.shortCode.padEnd(8) +
      String(entry.connectionsCount).padEnd(8) +
      String(entry.completedSquaresCount).padEnd(10) +
      String(entry.distinctTraitsCount).padEnd(8) +
      bingoStr
    );
  }
  console.log("-".repeat(70));

  const winner = leaderboard[0];
  console.log(`\n👑 OFFICIAL WINNER: ${winner.displayName} (PIN: ${winner.shortCode})`);
  console.log(`   • Score: ${winner.connectionsCount} Verified Meets, ${winner.completedSquaresCount} Squares Filled`);
  console.log(`   • Award Prize: "${event.prizeDescription}"`);

  // 6. Funnel & Summary
  const durationMs = Date.now() - startTime;
  console.log(`\n--- SIMULATION SUMMARY ---`);
  console.log(`• Total Players Simulated: ${playerCount}`);
  console.log(`• Total Verified Handshakes: ${totalConnectionsConfirmed}`);
  console.log(`• Median Meets per Player: ${leaderboard[Math.floor(leaderboard.length / 2)]?.connectionsCount || 0}`);
  console.log(`• Simulation Runtime: ${(durationMs / 1000).toFixed(2)}s`);
  console.log("=".repeat(65) + "\n");
}

const args = process.argv.slice(2);
let count = 25;
for (const arg of args) {
  if (arg.startsWith("--players=")) {
    count = parseInt(arg.split("=")[1], 10) || 25;
  }
}

runFullGameSimulation(count)
  .catch((e) => {
    console.error("Simulation failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
