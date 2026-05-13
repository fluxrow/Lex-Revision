import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAccount } from "@/lib/auth/account";
import { createManualBetaSignatureRequest } from "@/lib/signatures/manual";
import { createClient } from "@/lib/supabase/server";

const manageSignatureSchema = z.object({
  action: z.enum(["cancel", "restart"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const payload = manageSignatureSchema.parse(await request.json());
    const { requestId } = await params;
    const account = await getCurrentAccount();

    if (!account.user || !account.organization) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    if (account.isPreview) {
      return NextResponse.json(
        { error: "Preview admin em modo somente leitura. Ative a conta real para gerenciar assinaturas." },
        { status: 409 }
      );
    }

    const supabase = await createClient();
    const origin = new URL(request.url).origin;
    const { data: signatureRequest, error: requestError } = await supabase
      .from("signature_requests")
      .select("id, contract_id, provider, status, sent_at, completed_at")
      .eq("id", requestId)
      .maybeSingle();

    const { data: contract } = signatureRequest
      ? await supabase
          .from("contracts")
          .select("id, organization_id, name")
          .eq("id", signatureRequest.contract_id)
          .maybeSingle()
      : { data: null };

    const { data: signers } = signatureRequest
      ? await supabase
          .from("signers")
          .select("id, name, email, document, position, status, signature_url")
          .eq("signature_request_id", requestId)
          .order("position", { ascending: true })
      : { data: [] };

    if (
      requestError ||
      !signatureRequest ||
      !contract ||
      contract.organization_id !== account.organization.id
    ) {
      return NextResponse.json({ error: "Rodada de assinatura não encontrada." }, { status: 404 });
    }

    if (payload.action === "cancel") {
      if (!["sent", "partial"].includes(signatureRequest.status || "")) {
        return NextResponse.json(
          { error: "A rodada já foi encerrada e não pode mais ser cancelada." },
          { status: 409 }
        );
      }

      const now = new Date().toISOString();
      const { error: cancelError } = await supabase
        .from("signature_requests")
        .update({
          status: "cancelled",
          completed_at: now,
        })
        .eq("id", requestId);

      if (cancelError) {
        throw cancelError;
      }

      const { error: contractUpdateError } = await supabase
        .from("contracts")
        .update({
          status: "draft",
          signed_at: null,
          updated_at: now,
        })
        .eq("id", signatureRequest.contract_id);

      if (contractUpdateError) {
        throw contractUpdateError;
      }

      await supabase.from("activity_logs").insert({
        organization_id: account.organization.id,
        user_id: account.user.id,
        action: "signature_request.cancelled",
        resource_type: "signature_request",
        resource_id: requestId,
        metadata: {
          contract_id: signatureRequest.contract_id,
          contract_name: contract.name || null,
          provider: signatureRequest.provider || "lex_beta",
          cancelled_by: account.user.email || account.user.id,
        },
      });

      return NextResponse.json({
        ok: true,
        status: "cancelled",
        message: "Rodada encerrada. O contrato voltou para rascunho e pode receber uma nova rodada.",
      });
    }

    if (signatureRequest.provider !== "lex_beta") {
      return NextResponse.json(
        { error: "A reinicialização automática está disponível apenas no fluxo beta manual do Lex." },
        { status: 409 }
      );
    }

    if (["sent", "partial"].includes(signatureRequest.status || "")) {
      return NextResponse.json(
        { error: "Já existe uma rodada aberta para este contrato." },
        { status: 409 }
      );
    }

    const { data: openRequest } = await supabase
      .from("signature_requests")
      .select("id, status")
      .eq("contract_id", signatureRequest.contract_id)
      .neq("id", requestId)
      .in("status", ["sent", "partial"])
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (openRequest) {
      return NextResponse.json(
        {
          error: "Já existe outra rodada aberta para este contrato.",
          signatureRequestId: openRequest.id,
          status: openRequest.status,
        },
        { status: 409 }
      );
    }

    if (!signers || signers.length === 0) {
      return NextResponse.json(
        { error: "Esta rodada não possui signatários para reutilizar." },
        { status: 409 }
      );
    }

    const restarted = await createManualBetaSignatureRequest({
      admin: supabase,
      contractId: signatureRequest.contract_id,
      organizationId: account.organization.id,
      requestedBy: account.user.email || account.user.id,
      signers: signers.map((signer) => ({
        name: signer.name,
        email: signer.email,
        document: signer.document || null,
        position: signer.position || 0,
      })),
      origin,
      createdVia: "signature_request_restart",
      restartedFromRequestId: requestId,
    });

    await supabase.from("activity_logs").insert({
      organization_id: account.organization.id,
      user_id: account.user.id,
      action: "signature_request.restarted",
      resource_type: "signature_request",
      resource_id: requestId,
      metadata: {
        contract_id: signatureRequest.contract_id,
        contract_name: contract.name || null,
        provider: "lex_beta",
        new_request_id: restarted.signatureRequest.id,
        restarted_by: account.user.email || account.user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      status: restarted.signatureRequest.status,
      newRequestId: restarted.signatureRequest.id,
      message: "Nova rodada criada com os mesmos signatários do fluxo beta anterior.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Não foi possível gerenciar esta rodada de assinatura." },
      { status: 400 }
    );
  }
}
