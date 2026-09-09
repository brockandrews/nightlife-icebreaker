import { PrismaClient } from "@prisma/client";
import { SYSTEM_THEME_PACKS } from "../src/lib/theme-packs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Theme Packs & Questions into database...");

  // 1. Seed all 8 System Theme Packs
  for (const packDef of SYSTEM_THEME_PACKS) {
    const pack = await prisma.themePack.upsert({
      where: { slug: packDef.slug },
      update: {
        name: packDef.name,
        description: packDef.description,
        targetAudience: packDef.targetAudience,
        tone: packDef.tone,
        accentColor: packDef.accentColor,
        iconName: packDef.iconName,
        cardSizeDefault: packDef.cardSizeDefault,
        isDefault: packDef.isDefault ?? false,
        order: packDef.order,
      },
      create: {
        slug: packDef.slug,
        name: packDef.name,
        description: packDef.description,
        targetAudience: packDef.targetAudience,
        tone: packDef.tone,
        accentColor: packDef.accentColor,
        iconName: packDef.iconName,
        cardSizeDefault: packDef.cardSizeDefault,
        ownership: "SYSTEM",
        isDefault: packDef.isDefault ?? false,
        order: packDef.order,
      },
    });

    console.log(`✓ Seeded Theme Pack: ${pack.name} (${pack.slug})`);

    // 2. Seed template questions for this theme pack (where eventId is null)
    for (const q of packDef.questions) {
      const existingQ = await prisma.question.findFirst({
        where: {
          themePackId: pack.id,
          eventId: null,
          category: q.category,
        },
      });

      if (existingQ) {
        await prisma.question.update({
          where: { id: existingQ.id },
          data: {
            prompt: q.prompt,
            options: JSON.stringify(q.options),
            traitTemplate: q.traitTemplate,
            conversationPrompt: q.conversationPrompt,
            order: q.order,
          },
        });
      } else {
        await prisma.question.create({
          data: {
            themePackId: pack.id,
            eventId: null,
            category: q.category,
            prompt: q.prompt,
            options: JSON.stringify(q.options),
            traitTemplate: q.traitTemplate,
            conversationPrompt: q.conversationPrompt,
            isCustom: false,
            order: q.order,
          },
        });
      }
    }
  }

  // 3. Backfill existing events that have no themePackId to "nightlife"
  const nightlifePack = await prisma.themePack.findUnique({
    where: { slug: "nightlife" },
  });

  if (nightlifePack) {
    const updatedEvents = await prisma.event.updateMany({
      where: { themePackId: null },
      data: { themePackId: nightlifePack.id },
    });
    console.log(`✓ Backfilled ${updatedEvents.count} events to Nightlife ThemePack`);

    // Also update existing questions associated with those events if they don't have themePackId
    const updatedQuestions = await prisma.question.updateMany({
      where: { themePackId: null, eventId: { not: null } },
      data: { themePackId: nightlifePack.id },
    });
    console.log(`✓ Backfilled ${updatedQuestions.count} event questions with themePackId`);
  }

  console.log("Theme pack seeding and migration completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
