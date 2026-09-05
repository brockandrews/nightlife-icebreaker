import { NextResponse } from "next/server";
import { getAuthenticatedHost } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { stripe, getPackById } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const host = await getAuthenticatedHost();
    if (!host) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to purchase event credits." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { packId } = body;

    const pack = getPackById(packId);
    if (!pack) {
      return NextResponse.json(
        { success: false, error: "Invalid pricing package selected." },
        { status: 400 }
      );
    }

    // Determine host origin dynamically from request headers or env
    const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
        ? process.env.NEXT_PUBLIC_APP_URL
        : hostHeader
        ? `${proto}://${hostHeader}`
        : "https://mixxsocial.com";

    // Ensure Host has a stripeCustomerId
    let stripeCustomerId = host.stripeCustomerId;
    if (!stripeCustomerId) {
      try {
        const customer = await stripe.customers.create({
          email: host.email,
          name: host.displayName,
          metadata: {
            hostId: host.id,
          },
        });
        stripeCustomerId = customer.id;
        await prisma.host.update({
          where: { id: host.id },
          data: { stripeCustomerId },
        });
      } catch (custErr) {
        console.error("Error creating Stripe customer:", custErr);
        // Fallback: Proceed without customer reference
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId || undefined,
      customer_email: !stripeCustomerId ? host.email : undefined,
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `MixxSocial — ${pack.name}`,
              description: pack.description,
              images: [`${appUrl}/logo.png`],
            },
            unit_amount: pack.priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      allow_promotion_codes: true,
      client_reference_id: host.id,
      metadata: {
        hostId: host.id,
        packId: pack.id,
        creditsAdded: String(pack.credits),
      },
      success_url: `${appUrl}/promoter?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/promoter?payment=cancelled`,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Stripe checkout session error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
