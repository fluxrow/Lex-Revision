import { NextResponse } from "next/server";
import { z } from "zod";

import { createClicksignSignatureRequest, hasClicksignConfig } from "@/lib/clicksign";
import { getCurrentAccount } from "@/lib/auth/account";
import { buildManualSignatureUrl } from "@/lib/signatures/manual";
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
    const origin = new URL(request.url).origin;
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, name, status, organization_id, body_md, body_html")
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

    if (!hasClicksignConfig()) {
      const { data: signatureRequest, error: signatureRequestError } = await supabase
        .from("signature_requests")
        .insert({
          contract_id: payload.contractId,
          provider: "lex_beta",
          status: "sent",
          metadata: {
            dispatch_mode: "manual_beta_v1",
            created_via: "contract_detail",
            requested_by: account.user.email || account.user.id,
            signer_count: payload.signers.length,
            delivery_origin: origin,
          },
        })
        .select("id, provider, status, sent_at")
        .single();

      if (signatureRequestError || !signatureRequest) {
        throw signatureRequestError || new Error("Não foi possível iniciar a assinatura beta.");
      }

      const { data: createdSigners, error: signersError } = await supabase
        .from("signers")
        .insert(
          payload.signers.map((signer, index) => ({
            signature_request_id: signatureRequest.id,
            name: signer.name,
            email: signer.email,
            document: signer.document || null,
            status: "pending",
            position: index,
          }))
        )
        .select("id");

      if (signersError || !createdSigners) {
        throw signersError || new Error("Não foi possível criar os signatários do fluxo beta.");
      }

      for (const signer of createdSigners) {
        const signatureUrl = buildManualSignatureUrl(origin, signer.id);
        const { error: signatureUrlError } = await supabase
          .from("signers")
          .update({
            signature_url: signatureUrl,
          })
          .eq("id", signer.id);

        if (signatureUrlError) {
          throw signatureUrlError;
        }
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
          provider: "lex_beta",
          dispatch_mode: "manual_beta_v1",
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
        mode: "manual_beta_v1",
        message:
          "Fluxo beta iniciado. O Lex gerou links internos de aprovação para você compartilhar com os signatários.",
      });
    }

    const clicksignRequest = await createClicksignSignatureRequest({
      contractName: contract.name,
      contractBody: contract.body_md || contract.body_html || contract.name,
      signers: payload.signers,
    });

    const { data: signatureRequest, error: signatureRequestError } = await supabase
      .from("signature_requests")
      .insert({
        contract_id: payload.contractId,
        provider: "clicksign",
        external_id: clicksignRequest.documentKey,
        status: "sent",
        metadata: {
          dispatch_mode: "provider_clicksign_v1",
          created_via: "contract_detail",
          requested_by: account.user.email || account.user.id,
          document_key: clicksignRequest.documentKey,
          document_path: clicksignRequest.documentPath,
          file_name: clicksignRequest.fileName,
          signer_count: clicksignRequest.signers.length,
        },
      })
      .select("id, provider, status, sent_at")
      .single();

    if (signatureRequestError || !signatureRequest) {
      throw signatureRequestError || new Error("Não foi possível iniciar a assinatura.");
    }

    const { error: signersError } = await supabase.from("signers").insert(
      clicksignRequest.signers.map((signer, index) => ({
        signature_request_id: signatureRequest.id,
        name: signer.name,
        email: signer.email,
        document: signer.document || null,
        status: "pending",
        signature_url: signer.signatureUrl,
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
        dispatch_mode: "provider_clicksign_v1",
        document_key: clicksignRequest.documentKey,
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
      mode: "provider_clicksign_v1",
      message:
        "Fluxo de assinatura enviado pela Clicksign. O Lex já está acompanhando o status real dos signatários.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Não foi possível iniciar a assinatura." },
      { status: 400 }
    );
  }
}
