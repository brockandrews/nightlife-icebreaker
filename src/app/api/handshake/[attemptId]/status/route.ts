import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const attempt = await prisma.connectionAttempt.findUnique({
      where: { id: attemptId },
      include: {
        initiator: { select: { id: true, displayName: true, shortCode: true } },
        target: { select: { id: true, displayName: true, shortCode: true } },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: "Attempt not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const isExpired =
      attempt.status === "PENDING" && now > attempt.expiresAt;

    return NextResponse.json({
      success: true,
      status: isExpired ? "EXPIRED" : attempt.status,
      attemptId: attempt.id,
      initiator: attempt.initiator,
      target: attempt.target,
      expiresAt: attempt.expiresAt,
      remainingSeconds: Math.max(
        0,
        Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000)
      ),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
