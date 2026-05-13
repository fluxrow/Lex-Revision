import Link from "next/link";

import ManualSignaturePortal from "@/components/signatures/ManualSignaturePortal";
import Icon from "@/components/ui/Icon";
import { verifyManualSignatureToken } from "@/lib/signatures/manual";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParamsInput =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

type SignaturePortalPageProps = {
  params: Promise<{ signerId: string }>;
  searchParams?: SearchParamsInput;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignaturePortalPage({
  params,
  searchParams,
}: SignaturePortalPageProps) {
  const { signerId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const token = getSearchParamValue(resolvedSearchParams.token) || null;
  const admin = createAdminClient();

  const { data: signer, error } = await admin
    .from("signers")
    .select(
      `
        id,
        name,
        email,
        status,
        viewed_at,
        signed_at,
        signature_request_id,
        signature_requests(
          id,
          status,
          provider,
          contracts(
            id,
            organization_id,
            name,
            status,
            body_md,
            body_html
          )
        )
      `
    )
    .eq("id", signerId)
    .maybeSingle();

  const invalidLink = !signer || error || !verifyManualSignatureToken(signerId, token);
  const signatureRequest = Array.isArray(signer?.signature_requests)
    ? signer.signature_requests[0]
    : signer?.signature_requests;
  const contract = Array.isArray(signatureRequest?.contracts)
    ? signatureRequest.contracts[0]
    : signatureRequest?.contracts;

  if (!invalidLink && signer.status === "pending") {
    await admin
      .from("signers")
      .update({
        status: "viewed",
        viewed_at: signer.viewed_at || new Date().toISOString(),
      })
      .eq("id", signerId);

    if (contract?.organization_id) {
      await admin.from("activity_logs").insert({
        organization_id: contract.organization_id,
        user_id: null,
        action: "signature_request.signer_viewed",
        resource_type: "signature_request",
        resource_id: signatureRequest?.id || null,
        metadata: {
          contract_id: contract.id,
          contract_name: contract.name || null,
          signer_id: signer.id,
          signer_email: signer.email || null,
          signer_name: signer.name || null,
          provider: signatureRequest?.provider || "lex_beta",
        },
      });
    }

    signer.status = "viewed";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        padding: "40px 20px 56px",
      }}
    >
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <Link
          href="/"
          className="row muted"
          style={{ gap: 6, marginBottom: 16, fontSize: 12.5, textDecoration: "none" }}
        >
          <Icon name="chevron-left" size={14} />
          Voltar para a página inicial
        </Link>

        <div className="page-head" style={{ marginBottom: 18 }}>
          <div>
            <h1 style={{ marginBottom: 8 }}>Aprovação de contrato</h1>
            <div className="page-sub">
              Fluxo beta do Lex Revision para validação interna sem custo de provider externo.
            </div>
          </div>
        </div>

        {invalidLink || !signatureRequest || !contract ? (
          <div className="card">
            <div className="card-title">Link inválido ou expirado</div>
            <div className="card-sub">
              Não foi possível validar esta solicitação de assinatura. Peça um novo link ao responsável pelo contrato.
            </div>
          </div>
        ) : (
          <div className="grid contract-detail-grid" style={{ alignItems: "start" }}>
            <div className="col" style={{ gap: 16 }}>
              <ManualSignaturePortal
                signerId={signerId}
                token={token || ""}
                signerName={signer.name}
                contractName={contract.name || "Contrato sem título"}
                currentStatus={normalizeSignerStatus(signer.status)}
              />
            </div>

            <div className="col" style={{ gap: 16 }}>
              <div className="card">
                <div className="card-title">{contract.name || "Contrato sem título"}</div>
                <div className="card-sub">
                  Provedor do fluxo: {signatureRequest.provider === "lex_beta" ? "Lex beta manual" : signatureRequest.provider}
                </div>
                <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <span className={`chip ${signatureRequest.status === "completed" ? "chip-green" : signatureRequest.status === "cancelled" ? "chip-red" : "chip-amber"}`}>
                    {signatureRequest.status}
                  </span>
                  <span className="chip">{contract.status || "pendente"}</span>
                </div>
              </div>

              <div className="card">
                <div className="card-title">Conteúdo do contrato</div>
                <div className="card-sub">
                  Visualização do documento enviado para aprovação nesta rodada beta.
                </div>
                <div
                  style={{
                    marginTop: 14,
                    padding: "16px 18px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.7,
                    fontSize: 13.5,
                  }}
                >
                  {contract.body_md || contract.body_html || "Sem conteúdo disponível."}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeSignerStatus(value: string | null | undefined) {
  switch (value) {
    case "signed":
    case "refused":
    case "viewed":
      return value;
    default:
      return "pending";
  }
}
