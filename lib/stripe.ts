import Stripe from "stripe";

// Stripe best practice 2026-04-22: prefer restricted key (rk_*) over secret key (sk_*).
// Fallback chain: STRIPE_RESTRICTED_KEY → STRIPE_SECRET_KEY → placeholder (dev only).
// Throws explicit error in production if both are missing (fail-fast).
const apiKey =
  process.env.STRIPE_RESTRICTED_KEY ||
  process.env.STRIPE_SECRET_KEY ||
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error(
          "Stripe credentials missing: set STRIPE_RESTRICTED_KEY (preferred) or STRIPE_SECRET_KEY in production env."
        );
      })()
    : "sk_test_placeholder");

export const stripe = new Stripe(apiKey, {
  apiVersion: "2026-04-22.dahlia" as any,
});
