import { NextResponse } from "next/server";
import { swapUnfillableSquare } from "@/lib/game-engine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerId, squareId } = body;

    if (!playerId || !squareId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: playerId and squareId" },
        { status: 400 }
      );
    }

    const result = await swapUnfillableSquare(playerId, squareId);

    return NextResponse.json({
      success: true,
      square: result.square,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Square swap error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to swap square" },
      { status: 400 }
    );
  }
}
