import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedHost } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const host = await getAuthenticatedHost();

    if (!host) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { code: id } = await params;

    // Fetch the target event
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id }, { doorCodeToken: id.toUpperCase() }],
        hostId: host.id,
      },
      include: {
        _count: {
          select: {
            players: true,
            connections: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found or does not belong to your organization." },
        { status: 404 }
      );
    }

    // 1. Per-Question Response Distribution
    const questions = await prisma.question.findMany({
      where: {
        OR: [
          { eventId: event.id },
          { surveyResponses: { some: { player: { eventId: event.id } } } },
        ],
      },
      include: {
        surveyResponses: {
          where: {
            player: { eventId: event.id },
          },
          select: {
            selectedOption: true,
            derivedTrait: true,
          },
        },
      },
      orderBy: { order: "asc" },
    });

    const questionStats = questions.map((q) => {
      let parsedOptions: string[] = [];
      try {
        parsedOptions = JSON.parse(q.options);
      } catch (e) {
        parsedOptions = [q.options];
      }

      const totalResponses = q.surveyResponses.length;
      const countsMap: Record<string, number> = {};

      for (const opt of parsedOptions) {
        countsMap[opt] = 0;
      }

      for (const r of q.surveyResponses) {
        countsMap[r.selectedOption] = (countsMap[r.selectedOption] || 0) + 1;
      }

      const optionsBreakdown = parsedOptions.map((opt) => {
        const count = countsMap[opt] || 0;
        const percentage =
          totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
        return {
          option: opt,
          count,
          percentage,
        };
      });

      // Sort options by count descending to identify top answers
      const sortedOptions = [...optionsBreakdown].sort((a, b) => b.count - a.count);
      const topOption = sortedOptions.length > 0 && sortedOptions[0].count > 0 ? sortedOptions[0] : null;

      return {
        id: q.id,
        prompt: q.prompt,
        category: q.category,
        totalResponses,
        options: optionsBreakdown,
        topOption,
      };
    });

    // 2. Historical Benchmarks Across All Events of This Host
    const allHostEvents = await prisma.event.findMany({
      where: { hostId: host.id },
      include: {
        _count: {
          select: {
            players: true,
            connections: true,
          },
        },
      },
    });

    const totalHostEvents = allHostEvents.length;
    let sumAttendees = 0;
    let sumConnections = 0;

    for (const evt of allHostEvents) {
      sumAttendees += evt._count.players;
      sumConnections += evt._count.connections;
    }

    const avgAttendeesPerEvent =
      totalHostEvents > 0 ? Math.round(sumAttendees / totalHostEvents) : 0;
    const avgConnectionsPerEvent =
      totalHostEvents > 0 ? Math.round(sumConnections / totalHostEvents) : 0;
    const avgConnectionsPerPlayer =
      sumAttendees > 0 ? Number((sumConnections / sumAttendees).toFixed(1)) : 0;

    const currentEventAttendees = event._count.players;
    const currentEventConnections = event._count.connections;
    const currentConnectionsPerPlayer =
      currentEventAttendees > 0
        ? Number((currentEventConnections / currentEventAttendees).toFixed(1))
        : 0;

    const attendanceComparisonPercent =
      avgAttendeesPerEvent > 0
        ? Math.round(((currentEventAttendees - avgAttendeesPerEvent) / avgAttendeesPerEvent) * 100)
        : 0;

    const connectionComparisonPercent =
      avgConnectionsPerPlayer > 0
        ? Math.round(((currentConnectionsPerPlayer - avgConnectionsPerPlayer) / avgConnectionsPerPlayer) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        venueName: event.venueName,
        doorCodeToken: event.doorCodeToken,
        scheduledDate: event.scheduledDate,
      },
      questionStats,
      historicalBenchmarks: {
        totalHostEvents,
        avgAttendeesPerEvent,
        avgConnectionsPerEvent,
        avgConnectionsPerPlayer,
        currentEventAttendees,
        currentEventConnections,
        currentConnectionsPerPlayer,
        attendanceComparisonPercent,
        connectionComparisonPercent,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
