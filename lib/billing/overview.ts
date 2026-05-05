import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { PLAN_CATALOG, PlanKey, normalizePlan } from "@/lib/billing/plans";

type OrganizationLike = {
  id: string;
  name: string;
  plan?: string | null;
  subscription_status?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  trial_ends_at?: string | null;
  activated_at?: string | null;
};

export async function getBillingOverview(organization: OrganizationLike) {
  if ((organization as OrganizationLike & { previewMode?: boolean }).previewMode) {
    const normalizedPlan = normalizePlan(organization.plan) ?? "professional";
    const planMeta = PLAN_CATALOG[normalizedPlan];

    return {
      plan: normalizedPlan,
      planMeta,
      status: "active",
      renewalDate: "15 mai. 2026",
      monthlyPriceLabel: formatMoney(planMeta.monthlyPriceCents, "BRL"),
      contractUsage: {
        current: 18,
        limitLabel: planMeta.contractLimitLabel,
        percent: getPercent(18, parseLimit(planMeta.contractLimitLabel)),
      },
      signatureUsage: {
        current: 42,
        limitLabel: normalizedPlan === "starter" ? "50/mês" : normalizedPlan === "professional" ? "200/mês" : "Ilimitado",
        percent: normalizedPlan === "firm" ? 0 : getPercent(42, normalizedPlan === "starter" ? 50 : 200),
      },
      clientUsage: {
        current: 12,
        limitLabel: "Base ativa",
        percent: 0,
      },
      memberUsage: {
        current: 4,
        limitLabel: planMeta.userLimitLabel,
        percent: getPercent(4, parseLimit(planMeta.userLimitLabel)),
      },
      invoices: [
        {
          id: "preview-invoice-1",
          externalId: "INV-PREVIEW-001",
          amountLabel: formatMoney(planMeta.monthlyPriceCents, "BRL"),
          status: "paid",
          dateLabel: "05 mai. 2026",
          periodEnd: null,
          pdfUrl: null,
        },
      ],
      canManageBilling: false,
      customerId: null,
      subscriptionId: null,
      activatedAt: organization.activated_at ?? null,
      trialEndsAt: organization.trial_ends_at ?? null,
    };
  }

  const supabase = await createClient();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const normalizedPlan = normalizePlan(organization.plan) ?? "starter";
  const planMeta = PLAN_CATALOG[normalizedPlan];
  const { data: organizationContracts } = await supabase
    .from("contracts")
    .select("id")
    .eq("organization_id", organization.id);

  const contractIds =
    organizationContracts?.map((contract) => contract.id) ?? ["00000000-0000-0000-0000-000000000000"];

  const [invoiceResult, contractsResult, signaturesResult, clientsResult, membersResult, subscription] =
    await Promise.all([
      supabase
        .from("invoices")
        .select("id, stripe_invoice_id, amount_cents, currency, status, pdf_url, period_start, period_end, paid_at, created_at")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("contracts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .gte("created_at", monthStart.toISOString()),
      supabase
        .from("signature_requests")
        .select("id", { count: "exact", head: true })
        .gte("sent_at", monthStart.toISOString())
        .in("contract_id", contractIds),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id),
      supabase
        .from("memberships")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id),
      getStripeSubscription(organization.stripe_subscription_id),
    ]);

  const stripeSubscription = subscription as any;
  const invoices = (invoiceResult.data ?? []).map((invoice) => ({
    id: invoice.id,
    externalId: invoice.stripe_invoice_id,
    amountLabel: formatMoney(invoice.amount_cents, invoice.currency || "BRL"),
    status: invoice.status,
    dateLabel: formatDate(invoice.paid_at || invoice.created_at),
    periodEnd: invoice.period_end,
    pdfUrl: invoice.pdf_url,
  }));

  const renewalDate =
    typeof stripeSubscription?.current_period_end === "number"
      ? formatDate(new Date(stripeSubscription.current_period_end * 1000).toISOString())
      : invoices[0]?.dateLabel ?? null;

  const monthlyAmountCents =
    stripeSubscription?.items?.data?.[0]?.price?.unit_amount ?? planMeta.monthlyPriceCents;
  const activeMemberCount = membersResult.count ?? 0;

  return {
    plan: normalizedPlan,
    planMeta,
    status: stripeSubscription?.status ?? organization.subscription_status ?? "inactive",
    renewalDate,
    monthlyPriceLabel: formatMoney(monthlyAmountCents, stripeSubscription?.currency || "BRL"),
    contractUsage: {
      current: contractsResult.count ?? 0,
      limitLabel: planMeta.contractLimitLabel,
      percent: getPercent(contractsResult.count ?? 0, parseLimit(planMeta.contractLimitLabel)),
    },
    signatureUsage: {
      current: signaturesResult.count ?? 0,
      limitLabel: normalizedPlan === "starter" ? "50/mês" : normalizedPlan === "professional" ? "200/mês" : "Ilimitado",
      percent: normalizedPlan === "firm" ? 0 : getPercent(signaturesResult.count ?? 0, normalizedPlan === "starter" ? 50 : 200),
    },
    clientUsage: {
      current: clientsResult.count ?? 0,
      limitLabel: "Base ativa",
      percent: 0,
    },
    memberUsage: {
      current: activeMemberCount,
      limitLabel: planMeta.userLimitLabel,
      percent: getPercent(activeMemberCount, parseLimit(planMeta.userLimitLabel)),
    },
    invoices,
    canManageBilling: Boolean(organization.stripe_customer_id),
    customerId: organization.stripe_customer_id ?? null,
    subscriptionId: organization.stripe_subscription_id ?? null,
    activatedAt: organization.activated_at ?? null,
    trialEndsAt: organization.trial_ends_at ?? null,
  };
}

async function getStripeSubscription(subscriptionId?: string | null) {
  if (!subscriptionId) {
    return null;
  }

  try {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice", "items.data.price"],
    });
  } catch {
    return null;
  }
}

function formatMoney(amountCents: number, currency: string) {
  return (amountCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

function formatDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function parseLimit(label: string) {
  const match = label.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function getPercent(current: number, limit: number | null) {
  if (!limit || limit <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((current / limit) * 100));
}
