export type PlanKey = "starter" | "professional" | "firm";

const PLAN_VALUES: PlanKey[] = ["starter", "professional", "firm"];

export function normalizePlan(value?: string | null): PlanKey | null {
  if (!value) {
    return null;
  }

  return PLAN_VALUES.includes(value as PlanKey) ? (value as PlanKey) : null;
}

export function getPriceIdFromPlan(plan?: PlanKey | null) {
  if (!plan) {
    return null;
  }

  const priceMap: Record<PlanKey, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    professional: process.env.STRIPE_PRICE_PROFESSIONAL,
    firm: process.env.STRIPE_PRICE_FIRM,
  };

  return priceMap[plan] || null;
}

export function getPlanFromPriceId(priceId?: string | null): PlanKey | null {
  if (!priceId) {
    return null;
  }

  const entries = [
    ["starter", process.env.STRIPE_PRICE_STARTER],
    ["professional", process.env.STRIPE_PRICE_PROFESSIONAL],
    ["firm", process.env.STRIPE_PRICE_FIRM],
  ] as const;

  const match = entries.find(([, configuredPriceId]) => configuredPriceId === priceId);
  return (match?.[0] as PlanKey | undefined) ?? null;
}

export function canAccessPlatform(subscriptionStatus?: string | null) {
  return ["active", "trialing", "past_due"].includes(subscriptionStatus || "");
}
