import { NextResponse } from "next/server";
import { z } from "zod";

import { findUserByEmail } from "@/lib/billing/stripe-sync";
import { buildUniqueOrganizationSlug } from "@/lib/organizations/slug";
import { createAdminClient } from "@/lib/supabase/admin";

const redeemVoucherSchema = z.object({
  voucherCode: z.string().trim().min(4),
  email: z.string().trim().email(),
  password: z.string().min(8),
  firstName: z.string().trim().optional().default(""),
  lastName: z.string().trim().optional().default(""),
  company: z.string().trim().optional().default(""),
});

function deriveNameParts(name: string) {
  const cleaned = name
    .trim()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");

  if (!cleaned) {
    return { firstName: "Tester", lastName: "Lex" };
  }

  const parts = cleaned.split(" ").filter(Boolean);
  const firstName = parts[0] || "Tester";
  const lastName = parts.slice(1).join(" ").trim();

  return {
    firstName,
    lastName: lastName || "Lex",
  };
}

export async function POST(request: Request) {
  try {
    const payload = redeemVoucherSchema.parse(await request.json());
    const supabaseAdmin = createAdminClient();
    const normalizedEmail = payload.email.toLowerCase();

    const { data: voucher, error: voucherError } = await supabaseAdmin
      .from("access_vouchers")
      .select(
        "id, issuer_organization_id, recipient_email, recipient_name, company_name, plan, role, code, status, expires_at"
      )
      .eq("code", payload.voucherCode.toUpperCase())
      .maybeSingle();

    if (voucherError) {
      throw voucherError;
    }

    if (!voucher) {
      return NextResponse.json({ error: "Voucher de acesso invalido." }, { status: 404 });
    }

    if (voucher.status === "redeemed") {
      return NextResponse.json(
        { error: "Este voucher ja foi utilizado. Entre pelo login para continuar." },
        { status: 409 }
      );
    }

    if (voucher.status === "revoked") {
      return NextResponse.json({ error: "Este voucher foi revogado." }, { status: 409 });
    }

    if (voucher.expires_at && new Date(voucher.expires_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from("access_vouchers")
        .update({ status: "expired" })
        .eq("id", voucher.id);

      return NextResponse.json({ error: "Este voucher expirou." }, { status: 409 });
    }

    if (voucher.recipient_email.toLowerCase() !== normalizedEmail) {
      return NextResponse.json(
        { error: "Use o mesmo e-mail autorizado no voucher para liberar o acesso." },
        { status: 409 }
      );
    }

    const existingUser = await findUserByEmail(supabaseAdmin, normalizedEmail);
    if (existingUser) {
      return NextResponse.json(
        {
          error: "Este e-mail ja possui cadastro. Entre pelo login para continuar.",
          redirectTo: `/login?email=${encodeURIComponent(normalizedEmail)}`,
        },
        { status: 409 }
      );
    }

    const fallbackIdentity =
      voucher.recipient_name?.trim() || normalizedEmail.split("@")[0] || "Tester Lex";
    const derivedNames = deriveNameParts(fallbackIdentity);
    const firstName = payload.firstName || derivedNames.firstName;
    const lastName = payload.lastName || derivedNames.lastName;
    const fullName = `${firstName} ${lastName}`.trim();
    const organizationName =
      payload.company.trim() ||
      voucher.company_name?.trim() ||
      `${fullName} - Teste Lex Revision`;

    let createdUserId: string | null = null;
    let organizationId: string | null = null;

    try {
      const { data: organization, error: organizationError } = await supabaseAdmin
        .from("organizations")
        .insert({
          name: organizationName,
          slug: buildUniqueOrganizationSlug(organizationName),
          plan: voucher.plan,
          subscription_status: "active",
          activated_at: new Date().toISOString(),
          trial_ends_at: null,
        })
        .select("id, plan")
        .single();

      if (organizationError || !organization) {
        throw organizationError || new Error("Nao foi possivel criar o workspace do voucher.");
      }

      organizationId = organization.id;

      const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          company: organizationName,
          access_source: "voucher",
          voucher_code: voucher.code,
        },
      });

      if (createUserError || !createdUser.user) {
        throw createUserError || new Error("Nao foi possivel criar o usuario do voucher.");
      }

      createdUserId = createdUser.user.id;

      const { error: membershipError } = await supabaseAdmin.from("memberships").insert({
        organization_id: organization.id,
        user_id: createdUser.user.id,
        role: voucher.role,
        full_name: fullName,
      });

      if (membershipError) {
        throw membershipError;
      }

      const { error: voucherUpdateError } = await supabaseAdmin
        .from("access_vouchers")
        .update({
          status: "redeemed",
          redeemed_at: new Date().toISOString(),
          redeemed_by_user_id: createdUser.user.id,
          redeemed_organization_id: organization.id,
        })
        .eq("id", voucher.id);

      if (voucherUpdateError) {
        throw voucherUpdateError;
      }

      return NextResponse.json({
        ok: true,
        organizationId: organization.id,
        plan: organization.plan,
      });
    } catch (error) {
      if (createdUserId) {
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
      }

      if (organizationId) {
        await supabaseAdmin.from("organizations").delete().eq("id", organizationId);
      }

      throw error;
    }
  } catch (error: any) {
    console.error("Voucher Redemption Error:", error);
    return NextResponse.json(
      { error: error.message || "Nao foi possivel liberar o acesso por voucher." },
      { status: 500 }
    );
  }
}
