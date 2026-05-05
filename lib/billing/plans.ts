export type PlanKey = "starter" | "professional" | "firm";

const PLAN_VALUES: PlanKey[] = ["starter", "professional", "firm"];

export const PLAN_CATALOG: Record<
  PlanKey,
  {
    label: string;
    tag: string;
    monthlyPriceCents: number;
    contractLimitLabel: string;
    userLimitLabel: string;
    description: string;
    features: string[];
  }
> = {
  starter: {
    label: "Starter",
    tag: "Solo",
    monthlyPriceCents: 9700,
    contractLimitLabel: "20 contratos/mês",
    userLimitLabel: "1 usuário",
    description: "Para advogado ou operação pequena validando o fluxo.",
    features: [
      "20 contratos por mês",
      "IA para geração e revisão",
      "1 usuário",
      "Upload e preenchimento de modelos",
    ],
  },
  professional: {
    label: "Professional",
    tag: "Mais vendido",
    monthlyPriceCents: 29700,
    contractLimitLabel: "100 contratos/mês",
    userLimitLabel: "5 usuários",
    description: "Para escritório com volume recorrente e time operacional.",
    features: [
      "100 contratos por mês",
      "Assinatura digital integrada",
      "5 usuários",
      "Histórico, clientes e faturamento",
    ],
  },
  firm: {
    label: "Firm",
    tag: "Escala",
    monthlyPriceCents: 69700,
    contractLimitLabel: "Volume ampliado",
    userLimitLabel: "Equipe expandida",
    description: "Para equipe maior e operação mais robusta.",
    features: [
      "Volume ampliado",
      "Equipe expandida",
      "Base operacional completa",
      "Suporte prioritário",
    ],
  },
};

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
