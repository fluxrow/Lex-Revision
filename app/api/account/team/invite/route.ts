import { randomUUID } from "crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAccount } from "@/lib/auth/account";
import { findUserByEmail } from "@/lib/billing/stripe-sync";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSupabaseAdminSetupMessage,
  hasAdminSupabaseEnv,
  isSupabaseEnvError,
} from "@/lib/supabase/env";

const inviteMemberSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(3),
  role: z.enum(["admin", "lawyer", "paralegal", "viewer"]),
});

export async function POST(request: Request) {
  try {
    const payload = inviteMemberSchema.parse(await request.json());
    const account = await getCurrentAccount();

    if (!account.user || !account.membership || !account.organization) {
      return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
    }

    if (account.isPreview) {
      return NextResponse.json(
        { error: "Preview admin em modo somente leitura. Configure o Supabase remoto para convidar equipe real." },
        { status: 409 }
      );
    }

    if (!["owner", "admin"].includes(account.membership.role || "")) {
      return NextResponse.json({ error: "Apenas owner ou admin podem convidar a equipe." }, { status: 403 });
    }

    if (!hasAdminSupabaseEnv()) {
      return NextResponse.json({ error: getSupabaseAdminSetupMessage() }, { status: 503 });
    }

    const supabaseAdmin = createAdminClient();
    const normalizedEmail = payload.email.toLowerCase();
    let targetUser = await findUserByEmail(supabaseAdmin, normalizedEmail);
    let createdNewUser = false;

    if (!targetUser) {
      const redirectBase = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const temporaryPassword = `Lex-${randomUUID()}`;
      const { data: invitedUser, error: inviteError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: temporaryPassword,
        email_confirm: false,
        user_metadata: {
          full_name: payload.fullName,
          organization_name: account.organization.name,
        },
      });

      if (inviteError || !invitedUser.user) {
        throw inviteError || new Error("Nao foi possivel criar o usuario convidado.");
      }

      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${redirectBase}/login`,
      });

      if (resetError) {
        throw resetError;
      }

      targetUser = {
        id: invitedUser.user.id,
        email: invitedUser.user.email || normalizedEmail,
      };
      createdNewUser = true;
    }

    const { data: existingMembership } = await supabaseAdmin
      .from("memberships")
      .select("id")
      .eq("organization_id", account.organization.id)
      .eq("user_id", targetUser.id)
      .maybeSingle();

    if (existingMembership) {
      return NextResponse.json(
        { error: "Este usuario ja faz parte do workspace." },
        { status: 409 }
      );
    }

    const { error: membershipError } = await supabaseAdmin.from("memberships").insert({
      organization_id: account.organization.id,
      user_id: targetUser.id,
      role: payload.role,
      full_name: payload.fullName,
    });

    if (membershipError) {
      throw membershipError;
    }

    return NextResponse.json({
      ok: true,
      email: targetUser.email || normalizedEmail,
      mode: createdNewUser ? "invite_sent" : "member_added",
    });
  } catch (error: any) {
    if (isSupabaseEnvError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: error.message || "Nao foi possivel convidar o membro." },
      { status: 400 }
    );
  }
}
