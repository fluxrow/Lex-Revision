import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAccount } from "@/lib/auth/account";
import { isSupabaseEnvError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const createContractSchema = z.object({
  name: z.string().trim().min(3),
  contractType: z.string().trim().min(2),
  body: z.string().trim().min(30),
  templateId: z.string().uuid().optional().nullable(),
  variableValues: z.record(z.string(), z.string()).optional().default({}),
  source: z.enum(["ai_generate", "template_fill", "upload_flow"]).optional().default("ai_generate"),
  appliedSuggestions: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        priority: z.string(),
        motivo: z.string(),
        text: z.string(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(request: Request) {
  try {
    const payload = createContractSchema.parse(await request.json());
    const account = await getCurrentAccount();

    if (!account.user || !account.membership || !account.organization) {
      return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        organization_id: account.organization.id,
        name: payload.name,
        status: "draft",
        contract_type: payload.contractType,
        template_id: payload.templateId ?? null,
        variable_values: payload.variableValues,
        body_md: payload.body,
        ai_suggestions: payload.appliedSuggestions,
        created_by: account.user.id,
      })
      .select("id, name, status, created_at")
      .single();

    if (contractError || !contract) {
      throw contractError || new Error("Nao foi possivel salvar o contrato.");
    }

    await supabase.from("activity_logs").insert({
      organization_id: account.organization.id,
      user_id: account.user.id,
      action: "contract.created",
      resource_type: "contract",
      resource_id: contract.id,
      metadata: {
        source: payload.source,
        contract_type: payload.contractType,
        template_id: payload.templateId ?? null,
        applied_suggestions: payload.appliedSuggestions.map((item) => item.id),
      },
    });

    if (payload.templateId) {
      const { data: template } = await supabase
        .from("contract_templates")
        .select("id, uses_count")
        .eq("id", payload.templateId)
        .maybeSingle();

      if (template) {
        await supabase
          .from("contract_templates")
          .update({ uses_count: (template.uses_count || 0) + 1 })
          .eq("id", payload.templateId);
      }
    }

    return NextResponse.json({
      ok: true,
      contract: {
        id: contract.id,
        name: contract.name,
        status: contract.status,
        createdAt: contract.created_at,
      },
    });
  } catch (error: any) {
    if (isSupabaseEnvError(error)) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      { error: error.message || "Nao foi possivel salvar o contrato." },
      { status: 400 }
    );
  }
}
