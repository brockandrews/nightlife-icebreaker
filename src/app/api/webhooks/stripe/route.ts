import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        const hostId = session.metadata?.hostId || session.client_reference_id;
        const creditsToAdd = parseInt(session.metadata?.creditsAdded || "1", 10);
        const packType = session.metadata?.packId || "single";

        if (hostId) {
          try {
            // Check if already processed
            const existingPurchase = await prisma.purchase.findUnique({
              where: { stripeSessionId: session.id },
            });

            if (!existingPurchase) {
              await prisma.$transaction([
                prisma.purchase.create({
                  data: {
                    hostId,
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
                  where: { id: hostId },
                  data: {
                    purchasedCredits: {
                      increment: creditsToAdd,
                    },
                  },
                }),
              ]);
              console.log(`Successfully credited ${creditsToAdd} events to host ${hostId}`);
            }
          } catch (dbErr) {
            console.error("Failed to fulfill purchase in webhook:", dbErr);
            return NextResponse.json(
              { error: "Database error fulfilling order" },
              { status: 500 }
            );
          }
        }
      }
      break;
    }

    default:
      // Other unhandled event types
      break;
  }

  return NextResponse.json({ received: true });
}
