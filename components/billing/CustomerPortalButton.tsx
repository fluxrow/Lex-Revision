"use client";

import { useState, startTransition } from "react";

import Icon from "@/components/ui/Icon";

type CustomerPortalButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "lg";
  label?: string;
  returnPath?: string;
  className?: string;
  fullWidth?: boolean;
};

export default function CustomerPortalButton({
  variant = "secondary",
  size = "sm",
  label = "Gerenciar cobrança",
  returnPath = "/faturamento",
  className,
  fullWidth = false,
}: CustomerPortalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setLoading(true);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/stripe/customer-portal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ returnPath }),
        });

        const payload = await response.json();
        if (!response.ok || !payload.url) {
          throw new Error(payload.error || "Nao foi possivel abrir o portal de cobranca.");
        }

        window.location.href = payload.url;
      } catch (err: any) {
        setError(err.message || "Erro ao abrir portal.");
        setLoading(false);
      }
    });
  };

  return (
    <div style={fullWidth ? { width: "100%" } : undefined}>
      <button
        type="button"
        className={`btn btn-${variant} btn-${size}${className ? ` ${className}` : ""}`}
        style={fullWidth ? { width: "100%" } : undefined}
        onClick={handleClick}
        disabled={loading}
      >
        <Icon name="card" size={size === "lg" ? 15 : 13} />
        {loading ? "Abrindo..." : label}
      </button>
      {error && (
        <div style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
}
