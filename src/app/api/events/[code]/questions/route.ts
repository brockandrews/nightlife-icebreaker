import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ doorCodeToken: code.toUpperCase() }, { id: code }],
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    const questions = await prisma.question.findMany({
      where: {
        OR: [{ eventId: event.id }, { eventId: null }],
      },
      orderBy: { order: "asc" },
    });

    const parsedQuestions = questions.map((q) => {
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
        order: q.order,
      };
    });

    return NextResponse.json({
      success: true,
      questions: parsedQuestions,
      event: {
        id: event.id,
        name: event.name,
        venueName: event.venueName,
        cardSize: event.cardSize,
        scoringModel: event.scoringModel,
        completionMode: event.completionMode,
        prizeDescription: event.prizeDescription,
        status: event.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
