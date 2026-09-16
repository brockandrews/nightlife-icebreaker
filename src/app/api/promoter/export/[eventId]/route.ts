import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedHost } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const host = await getAuthenticatedHost();

    if (!host) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to export event data." },
        { status: 401 }
      );
    }

    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "leads";

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ id: eventId }, { doorCodeToken: eventId.toUpperCase() }],
        hostId: host.id,
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found or does not belong to your organization." },
        { status: 404 }
      );
    }

    // Role-based permission: Door staff cannot export consented marketing leads
    if (type !== "audit" && host.role === "DOOR_STAFF") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden. Door staff are not authorized to export consented attendee leads.",
        },
        { status: 403 }
      );
    }

    // ==========================================
    // TYPE 1: WINNER & CONNECTION AUDIT TRAIL
    // ==========================================
    if (type === "audit") {
      const [connections, winningCards] = await Promise.all([
        prisma.connection.findMany({
          where: { eventId: event.id },
          include: {
            playerA: { select: { displayName: true, shortCode: true } },
            playerB: { select: { displayName: true, shortCode: true } },
          },
          orderBy: { confirmedAt: "asc" },
        }),
        prisma.card.findMany({
          where: {
            eventId: event.id,
            isCompleted: true,
          },
          include: {
            player: { select: { displayName: true, shortCode: true } },
            squares: { where: { isCompleted: true } },
          },
          orderBy: { completedAt: "asc" },
        }),
      ]);

      const auditRows: { timestamp: Date; line: string }[] = [];

      // Record verified connections
      for (const conn of connections) {
        const line = [
          `"${conn.confirmedAt.toISOString()}"`,
          `"MUTUAL_CONNECTION"`,
          `"${conn.playerA.displayName.replace(/"/g, '""')}"`,
          `"${conn.playerA.shortCode}"`,
          `"${conn.playerB.displayName.replace(/"/g, '""')}"`,
          `"${conn.playerB.shortCode}"`,
          `"${conn.isSpeedRound ? "YES" : "NO"}"`,
          `"${conn.squaresSatisfiedA + conn.squaresSatisfiedB} squares satisfied"`,
          `"Mutual Handshake Verified (PairKey: ${conn.pairKey})"`,
        ].join(",");

        auditRows.push({ timestamp: conn.confirmedAt, line });
      }

      // Record verified bingo completions
      for (const card of winningCards) {
        const timestamp = card.completedAt || card.createdAt;
        const line = [
          `"${timestamp.toISOString()}"`,
          `"BINGO_COMPLETED"`,
          `"${card.player.displayName.replace(/"/g, '""')}"`,
          `"${card.player.shortCode}"`,
          `"N/A"`,
          `"N/A"`,
          `"N/A"`,
          `"${card.squares.length} completed squares"`,
          `"Pattern: ${card.winningLineType || "FULL_CARD"} Verified"`,
        ].join(",");

        auditRows.push({ timestamp, line });
      }

      // Sort all audit events chronologically
      auditRows.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const csvHeader = [
        "Timestamp (UTC)",
        "Audit Record Type",
        "Player 1 Name",
        "Player 1 PIN",
        "Player 2 Name",
        "Player 2 PIN",
        "Speed Round",
        "Score / Square Count",
        "Verification Method / Proof",
      ].join(",");

      const csvData = [csvHeader, ...auditRows.map((r) => r.line)].join("\n");
      const filename = `audit-${event.name.replace(/[^a-zA-Z0-9]/g, "_")}-${new Date().toISOString().split("T")[0]}.csv`;

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // ==========================================
    // TYPE 2: CONSENTED LEADS CSV
    // ==========================================
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
