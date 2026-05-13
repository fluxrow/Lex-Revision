import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyManualSignatureToken } from "@/lib/signatures/manual";
import { syncSignatureRequestStatus } from "@/lib/signatures/status";
import { createAdminClient } from "@/lib/supabase/admin";

const respondSchema = z.object({
  signerId: z.string().uuid(),
  token: z.string().trim().min(8),
  action: z.enum(["approve", "refuse"]),
});

export async function POST(request: Request) {
  try {
    const payload = respondSchema.parse(await request.json());

    if (!verifyManualSignatureToken(payload.signerId, payload.token)) {
      return NextResponse.json({ error: "Link de assinatura invalido." }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: signer, error: signerError } = await admin
      .from("signers")
      .select("id, status, viewed_at, signed_at, signature_request_id")
      .eq("id", payload.signerId)
      .maybeSingle();

    if (signerError || !signer) {
      return NextResponse.json({ error: "Signatario nao encontrado." }, { status: 404 });
    }

    const { data: signatureRequest, error: requestError } = await admin
      .from("signature_requests")
      .select("id, contract_id, status")
      .eq("id", signer.signature_request_id)
      .maybeSingle();

    if (requestError || !signatureRequest) {
      return NextResponse.json({ error: "Solicitacao de assinatura nao encontrada." }, { status: 404 });
    }

    if (["completed", "cancelled"].includes(signatureRequest.status || "")) {
      return NextResponse.json({
        ok: true,
        status: signer.status,
        requestStatus: signatureRequest.status,
      });
    }

    if (["signed", "refused"].includes(signer.status || "")) {
      return NextResponse.json({
        ok: true,
        status: signer.status,
        requestStatus: signatureRequest.status,
      });
    }

    const now = new Date().toISOString();
    const nextStatus = payload.action === "approve" ? "signed" : "refused";
    const patch: Record<string, string> = {
      status: nextStatus,
      viewed_at: signer.viewed_at || now,
    };

    if (payload.action === "approve") {
      patch.signed_at = now;
    }

    const { error: updateError } = await admin
      .from("signers")
      .update(patch)
      .eq("id", signer.id);

    if (updateError) {
      throw updateError;
    }

    await syncSignatureRequestStatus(admin, signatureRequest.id, signatureRequest.contract_id);

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      requestStatus: nextStatus === "refused" ? "cancelled" : "updated",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Nao foi possivel registrar a resposta da assinatura." },
      { status: 400 }
    );
  }
}
