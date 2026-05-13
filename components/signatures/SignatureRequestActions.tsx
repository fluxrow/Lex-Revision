"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import Icon from "@/components/ui/Icon";

type SignatureRequestActionsProps = {
  requestId: string;
  provider: string;
  status: string;
  allowRestart: boolean;
  signerLinks: Array<{
    name: string;
    email: string;
    signatureUrl: string | null;
  }>;
};

export default function SignatureRequestActions({
  requestId,
  provider,
  status,
  allowRestart,
  signerLinks,
}: SignatureRequestActionsProps) {
  const router = useRouter();
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<"cancel" | "restart" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isManualBeta = provider === "lex_beta";
  const canCancel = isManualBeta && ["sent", "partial"].includes(status);
  const canRestart = isManualBeta && allowRestart && ["completed", "cancelled"].includes(status);

  const copyAllLinks = async () => {
    const links = signerLinks.filter((signer) => signer.signatureUrl);

    if (links.length === 0) {
      setError("Esta rodada ainda não possui links públicos para copiar.");
      return;
    }

    const payload = links
      .map(
        (signer) =>
          `${signer.name} <${signer.email}>${signer.signatureUrl ? `\n${signer.signatureUrl}` : ""}`
      )
      .join("\n\n");

    try {
      await navigator.clipboard.writeText(payload);
      setCopiedAll(true);
      setError(null);
      setMessage("Todos os links desta rodada foram copiados.");
      window.setTimeout(() => setCopiedAll(false), 1800);
    } catch {
      setError("Não foi possível copiar os links desta rodada.");
    }
  };

  const manageRound = async (action: "cancel" | "restart") => {
    setIsSubmitting(action);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/signatures/${requestId}/manage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível atualizar esta rodada.");
      }

      setMessage(
        payload.message ||
          (action === "cancel"
            ? "Rodada encerrada com sucesso."
            : "Nova rodada criada com sucesso.")
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (manageError: any) {
      setError(manageError.message || "Não foi possível atualizar esta rodada.");
    } finally {
      setIsSubmitting(null);
    }
  };

  if (!isManualBeta && signerLinks.every((signer) => !signer.signatureUrl)) {
    return null;
  }

  return (
    <div className="col" style={{ gap: 10, marginTop: 12 }}>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {signerLinks.some((signer) => signer.signatureUrl) ? (
          <button className="btn btn-secondary btn-sm" type="button" onClick={copyAllLinks}>
            <Icon name="copy" size={12} />
            {copiedAll ? "Links copiados" : "Copiar todos os links"}
          </button>
        ) : null}

        {canCancel ? (
          <button
            className="btn btn-danger btn-sm"
            type="button"
            onClick={() => manageRound("cancel")}
            disabled={Boolean(isSubmitting)}
          >
            <Icon name="x" size={12} />
            {isSubmitting === "cancel" ? "Encerrando..." : "Encerrar rodada"}
          </button>
        ) : null}

        {canRestart ? (
          <button
            className="btn btn-secondary btn-sm"
            type="button"
            onClick={() => manageRound("restart")}
            disabled={Boolean(isSubmitting)}
          >
            <Icon name="plus" size={12} />
            {isSubmitting === "restart" ? "Criando..." : "Nova rodada com os mesmos signatários"}
          </button>
        ) : null}
      </div>

      {message ? (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            background: "var(--green-soft)",
            border: "1px solid var(--border)",
            color: "var(--green)",
          }}
        >
          {message}
        </div>
      ) : null}

      {error ? (
        <div
          style={{
            padding: "10px 12px",
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
