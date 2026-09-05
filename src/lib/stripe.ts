import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Warning: STRIPE_SECRET_KEY is not defined in environment variables.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia" as any,
  typescript: true,
  appInfo: {
    name: "MixxSocial",
    version: "1.0.0",
    url: "https://mixxsocial.com",
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
