const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkRoutes() {
  console.log("Checking DB queries and data...");

  const event = await prisma.event.findFirst({
    where: { OR: [{ doorCodeToken: "PILOT-2026" }, { id: "PILOT-2026" }] },
    include: {
      _count: {
        select: { players: true, connections: true },
      },
    },
  });
  console.log("Event:", event ? event.name : "NOT FOUND");

  const questions = await prisma.question.findMany({
    where: { OR: [{ eventId: event?.id }, { eventId: null }] },
    orderBy: { order: "asc" },
  });
  console.log("Questions count:", questions.length);

  const players = await prisma.player.findMany({
    where: { eventId: event?.id },
    include: {
      card: { include: { squares: true } },
    },
  });
  console.log("Players count:", players.length);

  for (const p of players) {
    console.log(`Player: ${p.displayName} (${p.shortCode}), Card squares: ${p.card?.squares?.length || 0}`);
  }
}

checkRoutes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
