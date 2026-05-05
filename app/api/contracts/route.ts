import { NextResponse } from "next/server";
import { z } from "zod";

import { buildContractIntelligence } from "@/lib/contracts/ingestion";
import { getCurrentAccount } from "@/lib/auth/account";
import { isSupabaseEnvError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const createContractSchema = z.object({
  name: z.string().trim().min(3),
  contractType: z.string().trim().min(2),
  body: z.string().trim().min(30),
  templateId: z.string().uuid().optional().nullable(),
  variableValues: z.record(z.string(), z.string()).optional().default({}),
  documentFile: z
    .object({
      name: z.string().trim().min(1),
      mimeType: z.string().trim().optional().nullable(),
      contentBase64: z.string().trim().min(1),
    })
    .optional()
    .nullable(),
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

    if (account.isPreview) {
      return NextResponse.json(
        { error: "Preview admin em modo somente leitura. Para salvar contratos reais, precisamos do Supabase remoto ativo." },
        { status: 409 }
      );
    }

    const supabase = await createClient();
    const intelligence = await buildContractIntelligence({
      body: payload.body,
      contractTypeHint: payload.contractType,
      variableValues: payload.variableValues,
      fileName: payload.documentFile?.name,
      mimeType: payload.documentFile?.mimeType,
      fileContentBase64: payload.documentFile?.contentBase64,
    });

    const baseInsertPayload = {
      organization_id: account.organization.id,
      name: payload.name,
      status: "draft",
      contract_type: payload.contractType,
      template_id: payload.templateId ?? null,
      variable_values: payload.variableValues,
      body_md: payload.body,
      ai_suggestions: payload.appliedSuggestions,
      created_by: account.user.id,
    };

    let contractInsert = await supabase
      .from("contracts")
      .insert({
        ...baseInsertPayload,
        source: payload.source,
        structured_payload: intelligence.structuredPayload,
      })
      .select("id, name, status, created_at")
      .single();

    if (contractInsert.error && isSchemaCompatError(contractInsert.error.message)) {
      contractInsert = await supabase
        .from("contracts")
        .insert(baseInsertPayload)
        .select("id, name, status, created_at")
        .single();
    }

    const { data: contract, error: contractError } = contractInsert;

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
        structured_contract_type: intelligence.structuredPayload.contractType,
        ingestion_provider: intelligence.structuredPayload.ingestionProvider,
        uploaded_document_name: payload.documentFile?.name || null,
      },
    });

    const analysisInsert = await supabase.from("contract_analysis_versions").insert({
      contract_id: contract.id,
      organization_id: account.organization.id,
      provider: intelligence.analysisVersion.provider,
      summary: intelligence.analysisVersion.summary,
      overall_risk: intelligence.analysisVersion.overallRisk,
      analysis_payload: intelligence.analysisVersion.analysisPayload,
      created_by: account.user.id,
    });
    if (analysisInsert.error && !isAnalysisCompatError(analysisInsert.error.message)) {
      throw analysisInsert.error;
    }

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
      structured: {
        contractType: intelligence.structuredPayload.contractType,
        sections: intelligence.structuredPayload.sections.length,
        parties: intelligence.structuredPayload.parties.length,
        provider: intelligence.structuredPayload.ingestionProvider,
      },
      analysis: {
        provider: intelligence.analysisVersion.provider,
        overallRisk: intelligence.analysisVersion.overallRisk,
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

function isSchemaCompatError(message?: string) {
  if (!message) {
    return false;
  }

  return ["structured_payload", "source", "Could not find the"].some((token) =>
    message.includes(token)
  );
}

function isAnalysisCompatError(message?: string) {
  if (!message) {
    return false;
  }

  return ["contract_analysis_versions", "analysis_payload", "overall_risk"].some((token) =>
    message.includes(token)
  );
}
