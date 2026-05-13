import { createHmac, timingSafeEqual } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

function getManualSignatureSecret() {
  return (
    process.env.SIGNATURE_LINK_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.LEX_PREVIEW_ADMIN_SECRET?.trim() ||
    ""
  );
}

export function hasManualSignatureSecret() {
  return Boolean(getManualSignatureSecret());
}

export function createManualSignatureToken(signerId: string) {
  const secret = getManualSignatureSecret();

  if (!secret) {
    throw new Error(
      "O ambiente não possui uma chave segura para gerar links internos de assinatura. Defina SIGNATURE_LINK_SECRET ou mantenha SUPABASE_SERVICE_ROLE_KEY no runtime."
    );
  }

  return createHmac("sha256", secret).update(signerId).digest("hex");
}

export function verifyManualSignatureToken(signerId: string, token: string | null) {
  if (!token) {
    return false;
  }

  try {
    const expected = createManualSignatureToken(signerId);
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function buildManualSignatureUrl(origin: string, signerId: string) {
  const url = new URL(`/assinar/${signerId}`, origin);
  url.searchParams.set("token", createManualSignatureToken(signerId));
  return url.toString();
}

type AdminClient = ReturnType<typeof createAdminClient>;

export type ManualBetaSignerInput = {
  name: string;
  email: string;
  document?: string | null;
  position?: number | null;
};

export async function createManualBetaSignatureRequest({
  admin,
  contractId,
  organizationId,
  requestedBy,
  signers,
  origin,
  createdVia,
  restartedFromRequestId,
}: {
  admin: AdminClient;
  contractId: string;
  organizationId: string;
  requestedBy: string;
  signers: ManualBetaSignerInput[];
  origin: string;
  createdVia: string;
  restartedFromRequestId?: string | null;
}) {
  const { data: signatureRequest, error: signatureRequestError } = await admin
    .from("signature_requests")
    .insert({
      contract_id: contractId,
      provider: "lex_beta",
      status: "sent",
      metadata: {
        dispatch_mode: "manual_beta_v1",
        created_via: createdVia,
        requested_by: requestedBy,
        signer_count: signers.length,
        delivery_origin: origin,
        restarted_from_request_id: restartedFromRequestId || null,
      },
    })
    .select("id, provider, status, sent_at")
    .single();

  if (signatureRequestError || !signatureRequest) {
    throw signatureRequestError || new Error("Não foi possível iniciar a assinatura beta.");
  }

  const orderedSigners = [...signers].sort(
    (left, right) => (left.position || 0) - (right.position || 0)
  );

  const { data: createdSigners, error: signersError } = await admin
    .from("signers")
    .insert(
      orderedSigners.map((signer, index) => ({
        signature_request_id: signatureRequest.id,
        name: signer.name,
        email: signer.email,
        document: signer.document || null,
        status: "pending",
        position: signer.position ?? index,
      }))
    )
    .select("id, name, email, position");

  if (signersError || !createdSigners) {
    throw signersError || new Error("Não foi possível criar os signatários do fluxo beta.");
  }

  const signersWithLinks = await Promise.all(
    createdSigners.map(async (signer) => {
      const signatureUrl = buildManualSignatureUrl(origin, signer.id);
      const { error: signatureUrlError } = await admin
        .from("signers")
        .update({
          signature_url: signatureUrl,
        })
        .eq("id", signer.id);

      if (signatureUrlError) {
        throw signatureUrlError;
      }

      return {
        ...signer,
        signatureUrl,
      };
    })
  );

  const now = new Date().toISOString();
  const { error: contractUpdateError } = await admin
    .from("contracts")
    .update({
      status: "pending_signature",
      signed_at: null,
      updated_at: now,
    })
    .eq("id", contractId);

  if (contractUpdateError) {
    throw contractUpdateError;
  }

  await admin.from("activity_logs").insert({
    organization_id: organizationId,
    user_id: null,
    action: "signature_request.created",
    resource_type: "signature_request",
    resource_id: signatureRequest.id,
    metadata: {
      contract_id: contractId,
      signers_count: orderedSigners.length,
      provider: "lex_beta",
      dispatch_mode: "manual_beta_v1",
      created_via: createdVia,
      restarted_from_request_id: restartedFromRequestId || null,
    },
  });

  return {
    signatureRequest,
    signers: signersWithLinks,
  };
}
