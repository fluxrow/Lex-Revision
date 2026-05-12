"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import Icon from "@/components/ui/Icon";

type SignerDraft = {
  name: string;
  email: string;
  document: string;
};

export default function SendForSignatureCard({
  contractId,
  initialSigner,
}: {
  contractId: string;
  initialSigner?: Partial<SignerDraft> | null;
}) {
  const router = useRouter();
  const [signers, setSigners] = useState<SignerDraft[]>([
    {
      name: initialSigner?.name || "",
      email: initialSigner?.email || "",
      document: initialSigner?.document || "",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateSigner = (index: number, field: keyof SignerDraft, value: string) => {
    setSigners((current) =>
      current.map((signer, signerIndex) =>
        signerIndex === index ? { ...signer, [field]: value } : signer
      )
    );
  };

  const addSigner = () => {
    setSigners((current) => [...current, { name: "", email: "", document: "" }]);
  };

  const removeSigner = (index: number) => {
    setSigners((current) => current.filter((_, signerIndex) => signerIndex !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/signatures/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractId,
          signers,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível iniciar a assinatura.");
      }

      setMessage(result.message || "Fluxo de assinatura iniciado.");
      startTransition(() => {
        router.refresh();
      });
    } catch (submitError: any) {
      setError(submitError.message || "Não foi possível iniciar a assinatura.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">Iniciar assinatura</div>
      <div className="card-sub">
        Defina quem precisa assinar. O Lex envia o contrato para a Clicksign e acompanha o status real da assinatura.
      </div>

      <div className="col" style={{ gap: 12 }}>
        {signers.map((signer, index) => (
          <div
            key={`signer-${index}`}
            style={{
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <div className="row sp-between" style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700 }}>Signatário {index + 1}</div>
              {signers.length > 1 ? (
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => removeSigner(index)}>
                  <Icon name="x" size={12} />
                  Remover
                </button>
              ) : null}
            </div>

            <div className="grid grid-2">
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">Nome</label>
                <input
                  className="input"
                  value={signer.name}
                  onChange={(event) => updateSigner(index, "name", event.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="field-label">E-mail</label>
                <input
                  className="input"
                  type="email"
                  value={signer.email}
                  onChange={(event) => updateSigner(index, "email", event.target.value)}
                  placeholder="email@cliente.com"
                />
              </div>
            </div>

            <div className="field" style={{ marginBottom: 0, marginTop: 12 }}>
              <label className="field-label">Documento</label>
              <input
                className="input"
                value={signer.document}
                onChange={(event) => updateSigner(index, "document", event.target.value)}
                placeholder="CPF ou CNPJ (opcional)"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="row" style={{ gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <button className="btn btn-secondary" type="button" onClick={addSigner}>
          <Icon name="plus" size={14} />
          Adicionar signatário
        </button>
        <button className="btn btn-primary" type="button" onClick={handleSubmit} disabled={isSubmitting}>
          <Icon name="send" size={14} />
          {isSubmitting ? "Enviando..." : "Enviar para assinatura"}
        </button>
      </div>

      {message ? (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
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
