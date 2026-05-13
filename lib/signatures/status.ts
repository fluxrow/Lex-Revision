import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export async function syncSignatureRequestStatus(
  admin: AdminClient,
  signatureRequestId: string,
  contractId: string
) {
  const { data: signers } = await admin
    .from("signers")
    .select("status")
    .eq("signature_request_id", signatureRequestId);

  const signerStatuses = Array.isArray(signers)
    ? signers.map((signer) => signer.status)
    : [];

  if (signerStatuses.length === 0) {
    return;
  }

  const allSigned = signerStatuses.every((status) => status === "signed");
  const anySigned = signerStatuses.some((status) => status === "signed");
  const anyRefused = signerStatuses.some((status) => status === "refused");

  if (allSigned) {
    await finalizeSignatureRequest(admin, signatureRequestId, contractId);
    return;
  }

  const nextStatus = anyRefused ? "cancelled" : anySigned ? "partial" : "sent";

  await admin
    .from("signature_requests")
    .update({
      status: nextStatus,
      completed_at: null,
    })
    .eq("id", signatureRequestId);

  await admin
    .from("contracts")
    .update({
      status: "pending_signature",
      signed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);
}

export async function finalizeSignatureRequest(
  admin: AdminClient,
  signatureRequestId: string,
  contractId: string
) {
  const now = new Date().toISOString();

  await admin
    .from("signature_requests")
    .update({
      status: "completed",
      completed_at: now,
    })
    .eq("id", signatureRequestId);

  await admin
    .from("contracts")
    .update({
      status: "signed",
      signed_at: now,
      updated_at: now,
    })
    .eq("id", contractId);
}
