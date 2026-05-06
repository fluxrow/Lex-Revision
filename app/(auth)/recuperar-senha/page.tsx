"use client";

import Link from "next/link";
import { useState } from "react";

import Icon from "@/components/ui/Icon";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/login`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (resetError) {
        throw resetError;
      }

      setMessage("Enviamos o link de redefinicao para o e-mail informado.");
    } catch (err: any) {
      setError(err.message || "Nao foi possivel enviar o link de redefinicao.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 4, padding: 4, background: "var(--surface-2)", borderRadius: 10, marginBottom: 28 }}>
        <Link href="/login" style={{ flex: 1, textAlign: "center", padding: "9px 12px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent", color: "var(--text-muted)" }}>
          Entrar
        </Link>
        <div style={{ flex: 1, textAlign: "center", padding: "9px 12px", borderRadius: 7, fontSize: 13, fontWeight: 600, background: "var(--surface)", color: "var(--text)", boxShadow: "var(--shadow-sm)" }}>
          Recuperar senha
        </div>
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 6px" }}>Recuperar acesso</h2>
      <p className="muted" style={{ margin: "0 0 28px", fontSize: 14 }}>
        Informe o e-mail da sua conta para receber o link de redefinicao.
      </p>

      <form onSubmit={requestReset}>
        <div className="field">
          <label className="field-label">E-mail</label>
          <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} />
        </div>
        {error ? (
          <div style={{ color: "var(--destructive, #ef4444)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 6 }}>
            {error}
          </div>
        ) : null}
        {message ? (
          <div style={{ color: "var(--green)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "var(--green-soft)", borderRadius: 6 }}>
            {message}
          </div>
        ) : null}
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
          {loading ? "Enviando..." : <>Enviar link <Icon name="arrow-right" size={16} /></>}
        </button>
      </form>
    </>
  );
}
