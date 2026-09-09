import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const pack = await prisma.themePack.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        questions: {
          where: { eventId: null },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!pack) {
      return NextResponse.json(
        { success: false, error: "Theme pack not found" },
        { status: 404 }
      );
    }

    const formattedQuestions = pack.questions.map((q) => {
      let options: string[] = [];
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
    });

    return NextResponse.json({
      success: true,
      themePack: {
        id: pack.id,
        slug: pack.slug,
        name: pack.name,
        description: pack.description,
        targetAudience: pack.targetAudience,
        tone: pack.tone,
        accentColor: pack.accentColor,
        iconName: pack.iconName,
        cardSizeDefault: pack.cardSizeDefault,
        isDefault: pack.isDefault,
        order: pack.order,
        questions: formattedQuestions,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
