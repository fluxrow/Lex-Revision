import { NextResponse } from "next/server";
import { z } from "zod";

import {
  findOrganizationByStripeIds,
  findUserByEmail,
  getCheckoutSessionDetails,
  getMembershipCount,
  upsertInvoiceFromStripeInvoice,
  upsertOrganizationFromBilling,
} from "@/lib/billing/stripe-sync";
import { createAdminClient } from "@/lib/supabase/admin";

const activationSchema = z.object({
  sessionId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = activationSchema.parse(await request.json());
    const checkout = await getCheckoutSessionDetails(payload.sessionId);

    if (checkout.session.status !== "complete") {
      return NextResponse.json(
        { error: "O checkout ainda nao foi concluido. Finalize o pagamento antes de ativar o acesso." },
        { status: 409 }
      );
    }

    if (!checkout.subscriptionId || !checkout.customerId) {
      return NextResponse.json(
        { error: "Nao foi possivel validar a assinatura deste checkout no Stripe." },
        { status: 409 }
      );
    }

    if (
      checkout.customerEmail &&
      checkout.customerEmail.toLowerCase() !== payload.email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Use o mesmo e-mail informado no checkout para ativar o acesso." },
        { status: 409 }
      );
    }

    const supabaseAdmin = createAdminClient();
    const existingUser = await findUserByEmail(supabaseAdmin, payload.email);

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Este e-mail ja possui cadastro. Entre pelo login para continuar.",
          redirectTo: `/login?email=${encodeURIComponent(payload.email)}`,
        },
        { status: 409 }
      );
    }

    const existingOrganization = await findOrganizationByStripeIds(
      supabaseAdmin,
      checkout.customerId,
      checkout.subscriptionId
    );

    if (existingOrganization) {
      const membershipCount = await getMembershipCount(supabaseAdmin, existingOrganization.id);
      if (membershipCount > 0) {
        return NextResponse.json(
          {
            error: "Este checkout ja foi ativado. Entre com o e-mail que fez a ativacao inicial.",
          },
          { status: 409 }
        );
      }
    }

    const { organization, created } = await upsertOrganizationFromBilling(supabaseAdmin, {
      organization: existingOrganization,
      customerId: checkout.customerId,
      subscriptionId: checkout.subscriptionId,
      plan: checkout.plan,
      subscriptionStatus: checkout.subscriptionStatus ?? "active",
      priceId: checkout.priceId,
      company: payload.company,
      customerName: checkout.customerName,
    });

    let createdUserId: string | null = null;

    try {
      const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          company: payload.company,
        },
      });

      if (createUserError || !createdUser.user) {
        throw createUserError || new Error("Nao foi possivel criar o usuario.");
      }

      createdUserId = createdUser.user.id;

      const { error: membershipError } = await supabaseAdmin.from("memberships").insert({
        organization_id: organization.id,
        user_id: createdUser.user.id,
        role: "owner",
        full_name: `${payload.firstName} ${payload.lastName}`.trim(),
      });

      if (membershipError) {
        throw membershipError;
      }

      await upsertInvoiceFromStripeInvoice(supabaseAdmin, organization.id, checkout.invoice);
    } catch (error) {
      if (createdUserId) {
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      }

      if (created) {
        await supabaseAdmin.from("organizations").delete().eq("id", organization.id);
      }

      throw error;
    }

    return NextResponse.json({
      ok: true,
      organizationId: organization.id,
      plan: organization.plan,
    });
  } catch (error: any) {
    console.error("Activation Error:", error);
    return NextResponse.json(
      { error: error.message || "Nao foi possivel ativar o acesso." },
      { status: 500 }
    );
  }
}
