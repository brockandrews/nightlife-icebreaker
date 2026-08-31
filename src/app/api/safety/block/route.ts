import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { blockerId, blockedId } = body;

    if (!blockerId || !blockedId) {
      return NextResponse.json(
        { success: false, error: "Both blockerId and blockedId are required" },
        { status: 400 }
      );
    }

    await prisma.blockedPlayer.upsert({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
      update: {},
      create: {
        blockerId,
        blockedId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Player blocked successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
