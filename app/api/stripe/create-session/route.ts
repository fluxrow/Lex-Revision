import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-04-22.dahlia" as any,
});

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

    const priceId = payload.priceId ?? getPriceIdFromPlan(payload.plan);
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
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getPriceIdFromPlan(plan?: "starter" | "professional" | "firm") {
  if (!plan) {
    return null;
  }

  const priceMap = {
    starter: process.env.STRIPE_PRICE_STARTER,
    professional: process.env.STRIPE_PRICE_PROFESSIONAL,
    firm: process.env.STRIPE_PRICE_FIRM,
  };

  return priceMap[plan] || null;
}
