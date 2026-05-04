import Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { PlanKey, getPlanFromPriceId, normalizePlan } from "@/lib/billing/plans";

type AdminClient = any;

type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscription_status?: string | null;
};

export type CheckoutSessionDetails = {
  session: Stripe.Checkout.Session;
  customerId: string | null;
  subscriptionId: string | null;
  subscriptionStatus: string | null;
  priceId: string | null;
  plan: PlanKey;
  customerEmail: string | null;
  customerName: string | null;
  invoice: Stripe.Invoice | null;
};

export async function getCheckoutSessionDetails(sessionId: string): Promise<CheckoutSessionDetails> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["customer", "subscription", "subscription.latest_invoice"],
  });

  const subscription =
    session.subscription && typeof session.subscription !== "string"
      ? session.subscription
      : null;

  const priceId =
    subscription?.items.data[0]?.price?.id ??
    session.metadata?.price_id ??
    null;

  const plan =
    normalizePlan(session.metadata?.plan) ??
    getPlanFromPriceId(priceId) ??
    "starter";

  const invoice =
    subscription?.latest_invoice && typeof subscription.latest_invoice !== "string"
      ? subscription.latest_invoice
      : null;

  const customerName =
    typeof session.customer !== "string" && session.customer && !("deleted" in session.customer)
      ? session.customer.name ?? session.customer_details?.name ?? null
      : session.customer_details?.name ?? null;

  return {
    session,
    customerId: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
    subscriptionId: typeof session.subscription === "string" ? session.subscription : subscription?.id ?? null,
    subscriptionStatus: subscription?.status ?? null,
    priceId,
    plan,
    customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
    customerName,
    invoice,
  };
}

export async function findOrganizationByStripeIds(
  supabaseAdmin: AdminClient,
  customerId?: string | null,
  subscriptionId?: string | null
) {
  if (subscriptionId) {
    const { data } = await supabaseAdmin
      .from("organizations")
      .select("id, name, slug, plan, subscription_status")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();

    if (data) {
      return data as OrganizationRecord;
    }
  }

  if (!customerId) {
    return null;
  }

  const { data } = await supabaseAdmin
    .from("organizations")
    .select("id, name, slug, plan, subscription_status")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return (data as OrganizationRecord | null) ?? null;
}

export async function upsertOrganizationFromBilling(
  supabaseAdmin: AdminClient,
  params: {
    organization?: OrganizationRecord | null;
    customerId?: string | null;
    subscriptionId?: string | null;
    plan: PlanKey;
    subscriptionStatus?: string | null;
    priceId?: string | null;
    company?: string | null;
    customerName?: string | null;
  }
) {
  const organizationName =
    params.company?.trim() ||
    params.customerName?.trim() ||
    params.organization?.name ||
    `Escritorio ${params.plan[0].toUpperCase()}${params.plan.slice(1)}`;

  const payload = {
    name: organizationName,
    plan: params.plan,
    stripe_customer_id: params.customerId ?? null,
    stripe_subscription_id: params.subscriptionId ?? null,
    stripe_price_id: params.priceId ?? null,
    subscription_status: params.subscriptionStatus ?? "active",
    activated_at: params.subscriptionStatus ? new Date().toISOString() : null,
  };

  if (params.organization) {
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .update(payload)
      .eq("id", params.organization.id)
      .select("id, name, slug, plan, subscription_status")
      .single();

    if (error) {
      throw error;
    }

    return { organization: data as OrganizationRecord, created: false };
  }

  const { data, error } = await supabaseAdmin
    .from("organizations")
    .insert({
      ...payload,
      slug: buildUniqueSlug(organizationName),
    })
    .select("id, name, slug, plan, subscription_status")
    .single();

  if (error) {
    throw error;
  }

  return { organization: data as OrganizationRecord, created: true };
}

export async function getMembershipCount(supabaseAdmin: AdminClient, organizationId: string) {
  const { count, error } = await supabaseAdmin
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function findUserByEmail(supabaseAdmin: AdminClient, email: string) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    throw error;
  }

  const match =
    data.users.find((user: { email?: string | null }) => user.email?.toLowerCase() === email.toLowerCase()) ??
    null;

  return match ? { id: match.id, email: match.email || email } : null;
}

export async function upsertInvoiceFromStripeInvoice(
  supabaseAdmin: AdminClient,
  organizationId: string,
  invoice?: Stripe.Invoice | null
) {
  if (!invoice?.id) {
    return;
  }

  const period = invoice.lines?.data?.[0]?.period;
  const paidAt =
    typeof invoice.status_transitions?.paid_at === "number"
      ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
      : null;

  const { error } = await supabaseAdmin
    .from("invoices")
    .upsert(
      {
        organization_id: organizationId,
        stripe_invoice_id: invoice.id,
        amount_cents: invoice.amount_paid || invoice.amount_due || 0,
        currency: (invoice.currency || "brl").toUpperCase(),
        status: invoice.status || "open",
        pdf_url: invoice.hosted_invoice_url ?? null,
        period_start: period ? new Date(period.start * 1000).toISOString() : null,
        period_end: period ? new Date(period.end * 1000).toISOString() : null,
        paid_at: paidAt,
      },
      { onConflict: "stripe_invoice_id" }
    );

  if (error) {
    throw error;
  }
}

function buildUniqueSlug(value: string) {
  const base = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "lex-revision";

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}
