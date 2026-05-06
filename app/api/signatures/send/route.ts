import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentAccount } from "@/lib/auth/account";
import { createClient } from "@/lib/supabase/server";

const sendSignatureSchema = z.object({
  contractId: z.string().uuid(),
  signers: z
    .array(
      z.object({
        name: z.string().trim().min(2),
        email: z.string().trim().email(),
        document: z.string().trim().optional().nullable(),
      })
    )
    .min(1),
});

export async function POST(request: Request) {
  try {
    const payload = sendSignatureSchema.parse(await request.json());
    const account = await getCurrentAccount();

    if (!account.user || !account.organization) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    if (account.isPreview) {
      return NextResponse.json(
        { error: "Preview admin em modo somente leitura. Ative a conta real para iniciar assinaturas." },
        { status: 409 }
      );
    }

    const supabase = await createClient();
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, name, status, organization_id")
      .eq("id", payload.contractId)
      .maybeSingle();

    if (contractError || !contract || contract.organization_id !== account.organization.id) {
      return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
    }

    const { data: existingRequest } = await supabase
      .from("signature_requests")
      .select("id, status")
      .eq("contract_id", payload.contractId)
      .neq("status", "cancelled")
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingRequest) {
      return NextResponse.json(
        {
          error: "Já existe um fluxo de assinatura aberto para este contrato.",
          signatureRequestId: existingRequest.id,
          status: existingRequest.status,
        },
        { status: 409 }
      );
    }

    const { data: signatureRequest, error: signatureRequestError } = await supabase
      .from("signature_requests")
      .insert({
        contract_id: payload.contractId,
        provider: "clicksign",
        status: "queued",
        metadata: {
          dispatch_mode: "internal_queue",
          created_via: "contract_detail",
          requested_by: account.user.email || account.user.id,
        },
      })
      .select("id, provider, status, sent_at")
      .single();

    if (signatureRequestError || !signatureRequest) {
      throw signatureRequestError || new Error("Não foi possível iniciar a assinatura.");
    }

    const { error: signersError } = await supabase.from("signers").insert(
      payload.signers.map((signer, index) => ({
        signature_request_id: signatureRequest.id,
        name: signer.name,
        email: signer.email,
        document: signer.document || null,
        status: "pending",
        position: index,
      }))
    );

    if (signersError) {
      throw signersError;
    }

    const { error: contractUpdateError } = await supabase
      .from("contracts")
      .update({
        status: "pending_signature",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.contractId);

    if (contractUpdateError) {
      throw contractUpdateError;
    }

    await supabase.from("activity_logs").insert({
      organization_id: account.organization.id,
      user_id: account.user.id,
      action: "signature_request.created",
      resource_type: "signature_request",
      resource_id: signatureRequest.id,
      metadata: {
        contract_id: payload.contractId,
        signers_count: payload.signers.length,
        provider: "clicksign",
        dispatch_mode: "internal_queue",
      },
    });

    return NextResponse.json({
      ok: true,
      request: {
        id: signatureRequest.id,
        provider: signatureRequest.provider,
        status: signatureRequest.status,
        sentAt: signatureRequest.sent_at,
      },
      mode: "internal_queue",
      message:
        "Fluxo de assinatura criado no Lex. O acompanhamento já está ativo; o disparo externo do provider entra na próxima camada de integração.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Não foi possível iniciar a assinatura." },
      { status: 400 }
    );
  }
}
