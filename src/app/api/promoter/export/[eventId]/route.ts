import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id: eventId }, { doorCodeToken: eventId.toUpperCase() }],
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    const players = await prisma.player.findMany({
      where: { eventId: event.id },
      include: {
        card: {
          include: { squares: true },
        },
        initiatedConnections: true,
        receivedConnections: true,
      },
      orderBy: { checkedInAt: "asc" },
    });

    // Build CSV content
    const csvRows = [
      [
        "Check-in Time (UTC)",
        "Display Name",
        "Email",
        "Phone",
        "Consented to Marketing",
        "Total Verified Connections",
        "Completed Squares",
        "Card Completed",
      ].join(","),
    ];

    for (const p of players) {
      const connectionsCount =
        p.initiatedConnections.length + p.receivedConnections.length;
      const completedSquares =
        p.card?.squares.filter((sq) => sq.isCompleted && !sq.isFreeSpace).length || 0;
      const isCardCompleted = p.card?.isCompleted ? "YES" : "NO";
      const consent = p.marketingOptIn ? "YES" : "NO";

      const row = [
        `"${p.checkedInAt.toISOString()}"`,
        `"${p.displayName.replace(/"/g, '""')}"`,
        `"${(p.contactEmail || "").replace(/"/g, '""')}"`,
        `"${(p.contactPhone || "").replace(/"/g, '""')}"`,
        `"${consent}"`,
        connectionsCount,
        completedSquares,
        `"${isCardCompleted}"`,
      ];

      csvRows.push(row.join(","));
    }

    const csvData = csvRows.join("\n");
    const filename = `leads-${event.name.replace(/[^a-zA-Z0-9]/g, "_")}-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
