"use client";

import { useState } from "react";
import Link from "next/link";

import Icon from "@/components/ui/Icon";

export default function ContractDetailActions({
  contractName,
  contractBody,
  hasSignatureFlow,
}: {
  contractName: string;
  contractBody: string;
  hasSignatureFlow: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([contractBody], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(contractName) || "contrato"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
      <button className="btn btn-secondary" type="button" onClick={handleDownload}>
        <Icon name="download" size={14} />
        Baixar texto
      </button>
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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
