import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAccount } from "@/lib/auth/account";
import { isSupabaseEnvError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(3),
  oabNumber: z.string().trim().max(60).optional().default(""),
  organizationName: z.string().trim().min(2),
});

export async function POST(request: Request) {
  try {
    const payload = updateProfileSchema.parse(await request.json());
    const account = await getCurrentAccount();

    if (!account.user || !account.membership || !account.organization) {
      return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
    }

    if (account.isPreview) {
      return NextResponse.json(
        { error: "Preview admin em modo somente leitura. Ative o Supabase remoto para editar perfil real." },
        { status: 409 }
      );
    }

    const supabase = await createClient();
    const { error: membershipError } = await supabase
      .from("memberships")
      .update({
        full_name: payload.fullName,
        oab_number: payload.oabNumber || null,
      })
      .eq("id", account.membership.id);

    if (membershipError) {
      throw membershipError;
    }

    if (["owner", "admin"].includes(account.membership.role || "")) {
      const { error: organizationError } = await supabase
        .from("organizations")
        .update({
          name: payload.organizationName,
        })
        .eq("id", account.organization.id);

      if (organizationError) {
        throw organizationError;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (isSupabaseEnvError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: error.message || "Nao foi possivel atualizar o perfil." },
      { status: 400 }
    );
  }
}
