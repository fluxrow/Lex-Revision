import { NextResponse } from "next/server";
import { z } from "zod";

import { getPriceIdFromPlan, getPlanFromPriceId, normalizePlan } from "@/lib/billing/plans";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const payload = z
      .object({
        priceId: z.string().optional(),
        plan: z.enum(["starter", "professional", "firm"]).optional(),
        email: z.string().email().optional(),
        successPath: z.string().optional(),
        cancelPath: z.string().optional(),
      })
      .parse(await request.json());

    const selectedPlan = payload.plan ?? getPlanFromPriceId(payload.priceId) ?? undefined;
    const priceId = payload.priceId ?? getPriceIdFromPlan(selectedPlan);
    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "Plano ainda nao configurado no Stripe. Defina STRIPE_PRICE_STARTER, STRIPE_PRICE_PROFESSIONAL e STRIPE_PRICE_FIRM.",
        },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successPath = payload.successPath || "/signup?checkout=success";
    const cancelPath = payload.cancelPath || "/#precos";
    const normalizedPlan = normalizePlan(selectedPlan) ?? "starter";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}${successPath}${successPath.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}${cancelPath}`,
      customer_email: payload.email,
      metadata: {
        plan: normalizedPlan,
        price_id: priceId,
        checkout_source: "lp",
      },
      subscription_data: {
        metadata: {
          plan: normalizedPlan,
          checkout_source: "lp",
        },
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
