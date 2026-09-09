import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const packs = await prisma.themePack.findMany({
      where: {
        ownership: "SYSTEM",
      },
      include: {
        _count: {
          select: {
            questions: {
              where: { eventId: null },
            },
          },
        },
        questions: {
          where: { eventId: null },
          select: {
            id: true,
            category: true,
            prompt: true,
            options: true,
            traitTemplate: true,
            conversationPrompt: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    });

    const formattedPacks = packs.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      targetAudience: p.targetAudience,
      tone: p.tone,
      accentColor: p.accentColor,
      iconName: p.iconName,
      cardSizeDefault: p.cardSizeDefault,
      isDefault: p.isDefault,
      order: p.order,
      questionCount: p._count.questions,
      sampleQuestions: p.questions.slice(0, 3).map((q) => q.prompt),
      questions: p.questions.map((q) => {
        let options = [];
        try {
          options = JSON.parse(q.options);
        } catch {
          options = [];
        }
        return {
          id: q.id,
          category: q.category,
          prompt: q.prompt,
          options,
          traitTemplate: q.traitTemplate,
          conversationPrompt: q.conversationPrompt,
          order: q.order,
        };
      }),
    }));

    return NextResponse.json({
      success: true,
      themePacks: formattedPacks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
