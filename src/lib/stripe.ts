import Stripe from "stripe";

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || "sk_test_placeholder",
  { apiVersion: "2026-07-29.dahlia" }
);

export const STRIPE_PLANS = {
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_PRICE_ID_STARTER ?? "",
    price: 49,
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_ID_PRO ?? "",
    price: 149,
  },
  enterprise: {
    name: "Enterprise",
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE ?? "",
    price: 349,
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;
