"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "lex.cookie-consent.v1";

type ConsentState = "accepted" | "essential-only" | null;

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "accepted" || stored === "essential-only") {
        setConsent(stored);
      }
    } catch {
      // localStorage indisponível — banner aparece mas não persiste
    }
  }, []);

  const handleChoice = (choice: "accepted" | "essential-only") => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    setConsent(choice);
  };

  // Não renderizar até hidratar (evita flash) ou se já houver escolha
  if (!mounted || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 720,
        margin: "0 auto",
        padding: 20,
        background: "var(--surface, #1a1a1a)",
        border: "1px solid var(--border, #2a2a2a)",
        borderRadius: 16,
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
          🍪 Cookies neste site
        </div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85 }}>
          Usamos cookies essenciais para autenticação e segurança. Com seu consentimento, também
          ativamos cookies opcionais para entender uso agregado e melhorar o produto. Sua escolha
          fica salva neste navegador.{" "}
          <Link href="/privacidade" style={{ textDecoration: "underline" }}>
            Saiba mais
          </Link>
          .
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => handleChoice("essential-only")}
          className="btn btn-ghost"
          style={{ flex: "1 1 auto" }}
        >
          Apenas essenciais
        </button>
        <button
          type="button"
          onClick={() => handleChoice("accepted")}
          className="btn btn-primary"
          style={{ flex: "1 1 auto" }}
        >
          Aceitar todos
        </button>
      </div>
    </div>
  );
}
