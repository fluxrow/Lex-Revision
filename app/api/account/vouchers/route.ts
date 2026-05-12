import { randomBytes } from "crypto";

import { NextResponse } from "next/server";
import { type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { getCurrentAccount } from "@/lib/auth/account";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSupabaseEnvError,
} from "@/lib/supabase/env";
import { createClient as createSessionClient } from "@/lib/supabase/server";

const createVoucherSchema = z.object({
  recipientName: z.string().trim().min(2),
  recipientEmail: z.string().trim().email(),
  companyName: z.string().trim().min(2).optional().or(z.literal("")),
  plan: z.enum(["starter", "professional", "firm"]).default("professional"),
  role: z.enum(["owner", "admin", "lawyer", "paralegal", "viewer"]).default("owner"),
  expiresAt: z.string().trim().optional().nullable(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const payload = createVoucherSchema.parse(await request.json());
    const account = await getCurrentAccount();

    if (!account.user || !account.membership || !account.organization) {
      return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
    }

    if (account.isPreview) {
      return NextResponse.json(
        { error: "Preview admin em modo somente leitura. Ative o Supabase remoto para emitir vouchers reais." },
        { status: 409 }
      );
    }

    if (!["owner", "admin"].includes(account.membership.role || "")) {
      return NextResponse.json({ error: "Apenas owner ou admin podem emitir vouchers." }, { status: 403 });
    }

    const supabase = account.isPreview
      ? createAdminClient()
      : await createSessionClient();
    const code = await generateUniqueVoucherCode(supabase);
    const expiresAt = payload.expiresAt ? new Date(`${payload.expiresAt}T23:59:59.999Z`) : null;

    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return NextResponse.json({ error: "Data de expiracao invalida." }, { status: 400 });
    }

    const { data: voucher, error: voucherError } = await supabase
      .from("access_vouchers")
      .insert({
        issuer_organization_id: account.organization.id,
        recipient_email: payload.recipientEmail.toLowerCase(),
        recipient_name: payload.recipientName,
        company_name: payload.companyName?.trim() || null,
        plan: payload.plan,
        role: payload.role,
        code,
        status: "issued",
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        notes: payload.notes?.trim() || null,
        created_by: account.user.id,
      })
      .select(
        "id, recipient_email, recipient_name, company_name, plan, role, code, status, notes, expires_at, redeemed_at, created_at"
      )
      .single();

    if (voucherError || !voucher) {
      throw voucherError || new Error("Nao foi possivel emitir o voucher.");
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const activationLink = `${baseUrl}/signup?voucher=${encodeURIComponent(voucher.code)}&email=${encodeURIComponent(voucher.recipient_email)}`;

    return NextResponse.json({
      ok: true,
      voucher: {
        id: voucher.id,
        recipientEmail: voucher.recipient_email,
        recipientName: voucher.recipient_name,
        companyName: voucher.company_name,
        plan: voucher.plan,
        role: voucher.role,
        code: voucher.code,
        status: voucher.status,
        notes: voucher.notes,
        expiresAt: voucher.expires_at,
        redeemedAt: voucher.redeemed_at,
        createdAt: voucher.created_at,
        activationLink,
      },
    });
  } catch (error: any) {
    if (isSupabaseEnvError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: error.message || "Nao foi possivel emitir o voucher." },
      { status: 400 }
    );
  }
}

async function generateUniqueVoucherCode(supabase: SupabaseClient) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `LEX-${randomBytes(4).toString("hex").toUpperCase()}`;
    const { data: existingVoucher, error } = await supabase
      .from("access_vouchers")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!existingVoucher) {
      return code;
    }
  }

  throw new Error("Nao foi possivel gerar um codigo de voucher unico.");
}
