"use client";

import { useState } from "react";
import Link from "next/link";

import Icon from "@/components/ui/Icon";

export default function ContractDetailActions({
  contractId,
  contractName,
  contractBody,
  hasSignatureFlow,
}: {
  contractId: string;
  contractName: string;
  contractBody: string;
  hasSignatureFlow: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contractBody);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <a
        className="btn btn-secondary"
        href={`/api/contracts/${contractId}/export?format=docx`}
        download
        style={{ textDecoration: "none" }}
      >
        <Icon name="download" size={14} />
        Baixar Word
      </a>
      <a
        className="btn btn-secondary"
        href={`/api/contracts/${contractId}/export?format=pdf`}
        download
        style={{ textDecoration: "none" }}
      >
        <Icon name="download" size={14} />
        Baixar PDF
      </a>
      <button className="btn btn-secondary" type="button" onClick={handleCopy}>
        <Icon name="copy" size={14} />
        {copied ? "Copiado" : "Copiar"}
      </button>
      <Link
        href={hasSignatureFlow ? "/assinaturas" : "#assinaturas"}
        className="btn btn-primary"
        style={{ textDecoration: "none" }}
      >
        <Icon name="send" size={14} />
        {hasSignatureFlow ? "Acompanhar assinatura" : "Iniciar assinatura"}
      </Link>
    </div>
  );
}
