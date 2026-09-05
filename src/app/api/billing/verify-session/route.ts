import { NextResponse } from "next/server";
import { getAuthenticatedHost } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(request: Request) {
  try {
    const host = await getAuthenticatedHost();
    if (!host) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Missing session_id parameter." },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify ownership
    const sessionHostId = session.metadata?.hostId || session.client_reference_id;
    if (sessionHostId !== host.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Session belongs to another host." },
        { status: 403 }
      );
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({
        success: false,
        status: session.payment_status,
        message: "Payment is not yet completed.",
      });
    }

    const creditsToAdd = parseInt(session.metadata?.creditsAdded || "1", 10);
    const packType = session.metadata?.packId || "single";

    // Idempotently record purchase and increment credits if not already processed
    const existingPurchase = await prisma.purchase.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (!existingPurchase) {
      await prisma.$transaction([
        prisma.purchase.create({
          data: {
            hostId: host.id,
            stripeSessionId: session.id,
            stripePaymentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || null,
            amountCents: session.amount_total || 0,
            currency: session.currency || "usd",
            creditsAdded: creditsToAdd,
            packType,
            status: "COMPLETED",
          },
        }),
        prisma.host.update({
          where: { id: host.id },
          data: {
            purchasedCredits: {
              increment: creditsToAdd,
            },
          },
        }),
      ]);
    }

    // Fetch updated host credits
    const updatedHost = await prisma.host.findUnique({
      where: { id: host.id },
      select: {
        freeEventsRemaining: true,
        purchasedCredits: true,
      },
    });

    return NextResponse.json({
      success: true,
      verified: true,
      creditsAdded: creditsToAdd,
      packType,
      host: updatedHost,
    });
  } catch (error: any) {
    console.error("Error verifying checkout session:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify session." },
      { status: 500 }
    );
  }
}
