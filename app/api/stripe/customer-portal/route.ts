import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAccount } from "@/lib/auth/account";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const payload = z
      .object({
        returnPath: z.string().optional(),
      })
      .parse(await request.json().catch(() => ({})));

    const account = await getCurrentAccount();
    if (!account.user || !account.organization?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Nao encontramos um cliente Stripe vinculado a esta conta." },
        { status: 400 }
      );
    }

    if (account.isPreview) {
      return NextResponse.json(
        { error: "Preview admin em modo somente leitura. O portal de cobranca real exige Stripe e Supabase remotos." },
        { status: 409 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: account.organization.stripe_customer_id,
      return_url: `${appUrl}${payload.returnPath || "/faturamento"}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Portal Error:", error);
    return NextResponse.json({ error: error.message || "Erro ao abrir portal." }, { status: 500 });
  }
}
