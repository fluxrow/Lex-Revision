import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAccount } from "@/lib/auth/account";
import { buildContractIntelligence } from "@/lib/contracts/ingestion";
import { buildVersionChangeSummary } from "@/lib/contracts/versions";
import { isSupabaseEnvError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const updateContractSchema = z.object({
  name: z.string().trim().min(3),
  contractType: z.string().trim().min(2),
  body: z.string().trim().min(30),
  variableValues: z.record(z.string(), z.string()).optional().default({}),
  changeSummary: z.string().trim().max(280).optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payload = updateContractSchema.parse(await request.json());
    const account = await getCurrentAccount();

    if (!account.user || !account.membership || !account.organization) {
      return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
    }

    if (account.isPreview) {
      return NextResponse.json(
        { error: "Preview admin em modo somente leitura. Para revisar contratos reais, precisamos do Supabase remoto ativo." },
        { status: 409 }
      );
    }

    const supabase = await createClient();
    const { data: currentContract, error: currentContractError } = await supabase
      .from("contracts")
      .select("id, organization_id, name, contract_type, body_md, variable_values")
      .eq("id", id)
      .eq("organization_id", account.organization.id)
      .maybeSingle();

    if (currentContractError || !currentContract) {
      return NextResponse.json({ error: "Contrato nao encontrado." }, { status: 404 });
    }

    const intelligence = await buildContractIntelligence({
      body: payload.body,
      contractTypeHint: payload.contractType,
      variableValues: payload.variableValues,
    });

    const versionLookup = await supabase
      .from("contract_versions")
      .select("version_number")
      .eq("contract_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersionNumber = versionLookup.data?.version_number
      ? Number(versionLookup.data.version_number) + 1
      : 2;

    const contractUpdate = await supabase
      .from("contracts")
      .update({
        name: payload.name,
        contract_type: payload.contractType,
        body_md: payload.body,
        variable_values: payload.variableValues,
        structured_payload: intelligence.structuredPayload,
      })
      .eq("id", id)
      .eq("organization_id", account.organization.id)
      .select("id, name, updated_at")
      .single();

    if (contractUpdate.error || !contractUpdate.data) {
      throw contractUpdate.error || new Error("Nao foi possivel atualizar o contrato.");
    }

    const versionInsert = await supabase.from("contract_versions").insert({
      contract_id: id,
      organization_id: account.organization.id,
      version_number: nextVersionNumber,
      name: payload.name,
      contract_type: payload.contractType,
      body_md: payload.body,
      structured_payload: intelligence.structuredPayload,
      change_summary: buildVersionChangeSummary(
        currentContract.body_md || "",
        payload.body,
        payload.changeSummary
      ),
      created_by: account.user.id,
    });
    if (versionInsert.error && !isVersionCompatError(versionInsert.error.message)) {
      throw versionInsert.error;
    }

    const analysisInsert = await supabase.from("contract_analysis_versions").insert({
      contract_id: id,
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

    await supabase.from("activity_logs").insert({
      organization_id: account.organization.id,
      user_id: account.user.id,
      action: "contract.updated",
      resource_type: "contract",
      resource_id: id,
      metadata: {
        version_number: nextVersionNumber,
        contract_type: payload.contractType,
        previous_name: currentContract.name,
        previous_contract_type: currentContract.contract_type,
        change_summary: payload.changeSummary?.trim() || null,
      },
    });

    return NextResponse.json({
      ok: true,
      contract: {
        id: contractUpdate.data.id,
        name: contractUpdate.data.name,
        updatedAt: contractUpdate.data.updated_at,
      },
      version: {
        number: nextVersionNumber,
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
      { error: error.message || "Nao foi possivel revisar o contrato." },
      { status: 400 }
    );
  }
}

function isAnalysisCompatError(message?: string) {
  if (!message) {
    return false;
  }

  return ["contract_analysis_versions", "analysis_payload", "overall_risk"].some((token) =>
    message.includes(token)
  );
}

function isVersionCompatError(message?: string) {
  if (!message) {
    return false;
  }

  return ["contract_versions", "version_number", "structured_payload"].some((token) =>
    message.includes(token)
  );
}
