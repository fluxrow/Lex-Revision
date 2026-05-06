import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAccount } from "@/lib/auth/account";
import { isSupabaseEnvError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const createClientSchema = z.object({
  name: z.string().trim().min(3),
  type: z.enum(["PF", "PJ"]).default("PF"),
  document: z.string().trim().optional().default(""),
  email: z.string().trim().email().optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const payload = createClientSchema.parse(await request.json());
    const account = await getCurrentAccount();

    if (!account.user || !account.membership || !account.organization) {
      return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
    }

    if (account.isPreview) {
      return NextResponse.json(
        { error: "Preview admin em modo somente leitura. Ative o Supabase remoto para cadastrar clientes reais." },
        { status: 409 }
      );
    }

    const supabase = await createClient();
    const { data: createdClient, error } = await supabase
      .from("clients")
      .insert({
        organization_id: account.organization.id,
        type: payload.type,
        name: payload.name,
        document: payload.document || null,
        email: payload.email || null,
        created_by: account.user.id,
      })
      .select("id, type, name, document, email, created_at")
      .single();

    if (error || !createdClient) {
      throw error || new Error("Nao foi possivel cadastrar o cliente.");
    }

    return NextResponse.json({
      ok: true,
      client: {
        id: createdClient.id,
        name: createdClient.name,
        type: createdClient.type,
        doc: createdClient.document || "—",
        email: createdClient.email || "—",
        contracts: 0,
        since: createdClient.created_at ? createdClient.created_at.substring(0, 7) : "—",
      },
    });
  } catch (error: any) {
    if (isSupabaseEnvError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: error.message || "Nao foi possivel cadastrar o cliente." },
      { status: 400 }
    );
  }
}
