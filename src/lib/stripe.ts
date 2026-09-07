import Stripe from "stripe";

export function getStripe(): Stripe {
  const key =
    process.env.STRIPE_SECRET_KEY ||
    process.env.STRIPE_API_KEY ||
    process.env.STRIPE_KEY ||
    process.env.STRIPE_SECRET;

  if (!key || key.includes("placeholder")) {
    throw new Error(
      "STRIPE_SECRET_KEY is missing in Vercel environment variables. In Vercel, go to Settings > Environment Variables, ensure STRIPE_SECRET_KEY is added for Production, and redeploy."
    );
  }

  return new Stripe(key, {
    apiVersion: "2025-02-24.acacia" as any,
    typescript: true,
    appInfo: {
      name: "MixxSocial",
      version: "1.0.0",
      url: "https://mixxsocial.com",
    },
  });
}

/**
 * Lazy proxy to Stripe client.
 * Safe for Next.js build-time static page collection and guarantees
 * live environment variable resolution at runtime.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const instance = getStripe();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export interface PricingPack {
  id: "single" | "bundle_3" | "bundle_10";
  name: string;
  badge?: string;
  credits: number;
  priceCents: number;
  unitPrice: string;
  description: string;
  popular?: boolean;
}

export const PRICING_PACKS: Record<string, PricingPack> = {
  single: {
    id: "single",
    name: "Single Event Pass",
    credits: 1,
    priceCents: 2900,
    unitPrice: "$29 / event",
    description: "Ideal for a one-time mixer, birthday, or private party.",
  },
  bundle_3: {
    id: "bundle_3",
    name: "Host 3-Pack",
    badge: "SAVE 20%",
    credits: 3,
    priceCents: 6900,
    unitPrice: "$23 / event",
    description: "Great for recurring event series, nightlife residencies, or campus mixers.",
    popular: true,
  },
  bundle_10: {
    id: "bundle_10",
    name: "Pro 10-Pack",
    badge: "SAVE 35%",
    credits: 10,
    priceCents: 18900,
    unitPrice: "$18.90 / event",
    description: "Best value for venues, professional event promoters, and enterprise hosts.",
  },
};

export function getPackById(packId: string): PricingPack | null {
  return PRICING_PACKS[packId] || null;
}
