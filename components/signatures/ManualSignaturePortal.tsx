"use client";

import { useState } from "react";

import Icon from "@/components/ui/Icon";

type ManualSignaturePortalProps = {
  signerId: string;
  token: string;
  signerName: string;
  contractName: string;
  currentStatus: "pending" | "viewed" | "signed" | "refused";
};

export default function ManualSignaturePortal({
  signerId,
  token,
  signerName,
  contractName,
  currentStatus,
}: ManualSignaturePortalProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loadingAction, setLoadingAction] = useState<"approve" | "refuse" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    currentStatus === "signed"
      ? "Sua aprovação já foi registrada."
      : currentStatus === "refused"
        ? "Esta solicitação já foi recusada."
        : null
  );

  const respond = async (action: "approve" | "refuse") => {
    setLoadingAction(action);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/signatures/manual/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signerId,
          token,
          action,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel registrar sua resposta.");
      }

      const nextStatus = action === "approve" ? "signed" : "refused";
      setStatus(nextStatus);
      setMessage(
        action === "approve"
          ? "Assinatura beta registrada com sucesso. O Lex já atualizou o acompanhamento do contrato."
          : "Recusa registrada. O responsável pelo contrato verá a atualização no painel."
      );
    } catch (responseError: any) {
      setError(responseError.message || "Nao foi possivel registrar sua resposta.");
    } finally {
      setLoadingAction(null);
    }
  };

  const isCompleted = status === "signed" || status === "refused";

  return (
    <div className="card">
      <div className="card-title">Ação do signatário</div>
      <div className="card-sub">
        {signerName}, você está respondendo ao fluxo beta do contrato{" "}
        <strong>{contractName}</strong>. Este modo não usa certificação externa:
        ele registra sua aprovação no Lex para validação interna.
      </div>

      <div
        style={{
          marginTop: 14,
          marginBottom: 14,
          padding: "12px 14px",
          borderRadius: 12,
          background: status === "signed" ? "var(--green-soft)" : status === "refused" ? "var(--red-soft)" : "var(--amber-soft)",
          border: "1px solid var(--border)",
          color: status === "signed" ? "var(--green)" : status === "refused" ? "var(--red)" : "var(--amber)",
        }}
      >
        {status === "signed"
          ? "Aprovação registrada."
          : status === "refused"
            ? "Solicitação recusada."
            : status === "viewed"
              ? "Documento visualizado. Você ainda pode aprovar ou recusar."
              : "Documento pendente de resposta."}
      </div>

      {!isCompleted ? (
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => respond("approve")}
            disabled={Boolean(loadingAction)}
          >
            <Icon name="check" size={14} />
            {loadingAction === "approve" ? "Registrando..." : "Aprovar contrato"}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => respond("refuse")}
            disabled={Boolean(loadingAction)}
          >
            <Icon name="x" size={14} />
            {loadingAction === "refuse" ? "Registrando..." : "Recusar"}
          </button>
        </div>
      ) : null}

      {message ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 12,
            background: status === "refused" ? "var(--amber-soft)" : "var(--green-soft)",
            border: "1px solid var(--border)",
            color: status === "refused" ? "var(--amber)" : "var(--green)",
          }}
        >
          {message}
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 12,
            background: "var(--red-soft)",
            border: "1px solid var(--border)",
            color: "var(--red)",
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
