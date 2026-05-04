import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  findOrganizationByStripeIds,
  getCheckoutSessionDetails,
  upsertInvoiceFromStripeInvoice,
  upsertOrganizationFromBilling,
} from "@/lib/billing/stripe-sync";
import { getPlanFromPriceId, normalizePlan } from "@/lib/billing/plans";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") as string;

    let event: Stripe.Event;

    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    const supabaseAdmin = createAdminClient();

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const checkout = await getCheckoutSessionDetails(session.id);
        const existingOrganization = await findOrganizationByStripeIds(
          supabaseAdmin,
          checkout.customerId,
          checkout.subscriptionId
        );

        const { organization } = await upsertOrganizationFromBilling(supabaseAdmin, {
          organization: existingOrganization,
          customerId: checkout.customerId,
          subscriptionId: checkout.subscriptionId,
          plan: checkout.plan,
          subscriptionStatus: checkout.subscriptionStatus ?? "active",
          priceId: checkout.priceId,
          customerName: checkout.customerName,
        });

        await upsertInvoiceFromStripeInvoice(supabaseAdmin, organization.id, checkout.invoice);
        break;
      }
      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceSubscription = invoice.parent?.subscription_details?.subscription;
        const organization = await findOrganizationByStripeIds(
          supabaseAdmin,
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null,
          typeof invoiceSubscription === "string"
            ? invoiceSubscription
            : invoiceSubscription?.id ?? null
        );

        if (!organization) {
          break;
        }

        await upsertInvoiceFromStripeInvoice(supabaseAdmin, organization.id, invoice);

        const nextStatus = event.type === "invoice.payment_succeeded" ? "active" : "past_due";
        await supabaseAdmin
          .from("organizations")
          .update({
            subscription_status: nextStatus,
          })
          .eq("id", organization.id);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const organization = await findOrganizationByStripeIds(
          supabaseAdmin,
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id ?? null,
          subscription.id
        );

        if (!organization) {
          break;
        }

        const priceId = subscription.items.data[0]?.price?.id ?? null;
        const plan =
          normalizePlan(subscription.metadata?.plan) ??
          getPlanFromPriceId(priceId) ??
          "starter";

        await upsertOrganizationFromBilling(supabaseAdmin, {
          organization,
          customerId:
            typeof subscription.customer === "string"
              ? subscription.customer
              : subscription.customer?.id ?? null,
          subscriptionId: subscription.id,
          plan,
          subscriptionStatus:
            event.type === "customer.subscription.deleted" ? "canceled" : subscription.status,
          priceId,
        });
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }
}
