"use client";

import { useState } from "react";

import Icon from "@/components/ui/Icon";

export default function SignatureLinkActions({
  signatureUrl,
}: {
  signatureUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(signatureUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <a
        href={signatureUrl}
        target="_blank"
        rel="noreferrer"
        className="btn btn-ghost btn-sm"
        style={{ textDecoration: "none" }}
      >
        <Icon name="send" size={12} />
        Abrir link
      </a>
      <button className="btn btn-ghost btn-sm" type="button" onClick={copyLink}>
        <Icon name="copy" size={12} />
        {copied ? "Copiado" : "Copiar link"}
      </button>
    </>
  );
}
