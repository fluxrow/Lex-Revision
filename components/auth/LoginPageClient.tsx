"use client";

import Icon from "@/components/ui/Icon";
import {
  getSupabaseProductionSetupMessage,
  isSupabaseEnvError,
} from "@/lib/supabase/env";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type LoginPageClientProps = {
  supabaseSetupRequired: boolean;
};

export default function LoginPageClient({
  supabaseSetupRequired,
}: LoginPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signedOut = searchParams.get("signed_out") === "1";
  const billingInactive = searchParams.get("billing") === "inactive";
  const previewModeEnabled =
    process.env.NEXT_PUBLIC_LEX_PREVIEW_ADMIN_ENABLED === "1";
  const previewAdminEmail =
    process.env.NEXT_PUBLIC_LEX_PREVIEW_ADMIN_EMAIL?.trim() ||
    "admin@preview.lex";
  const googleAuthEnabled =
    process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_ENABLED === "1";
  const initialEmail =
    searchParams.get("email") ||
    (supabaseSetupRequired && previewModeEnabled ? previewAdminEmail : "");

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (supabaseSetupRequired || searchParams.get("setup") !== "supabase") {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("setup");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/login?${nextQuery}` : "/login");
  }, [router, searchParams, supabaseSetupRequired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (supabaseSetupRequired && previewModeEnabled) {
        const response = await fetch("/api/auth/preview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          setError(payload.error || "Falha ao conectar com o preview admin.");
          return;
        }

        window.location.assign("/dashboard");
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        window.location.assign("/dashboard");
      }
    } catch (err: any) {
      setError(
        isSupabaseEnvError(err)
          ? getSupabaseProductionSetupMessage()
          : err.message || "Falha ao conectar com a autenticacao."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 4,
          padding: 4,
          background: "var(--surface-2)",
          borderRadius: 10,
          marginBottom: 28,
        }}
      >
        <Link
          href="/login"
          style={{
            flex: 1,
            textAlign: "center",
            padding: "9px 12px",
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            background: "var(--surface)",
            color: "var(--text)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          Entrar
        </Link>
        <Link
          href="/signup"
          style={{
            flex: 1,
            textAlign: "center",
            padding: "9px 12px",
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            background: "transparent",
            color: "var(--text-muted)",
          }}
        >
          Ativar acesso
        </Link>
      </div>

      <h2
        style={{
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          margin: "0 0 6px",
        }}
      >
        Acesso para clientes ativos
      </h2>
      <p className="muted" style={{ margin: "0 0 28px", fontSize: 14 }}>
        Se voce ja contratou um plano, entre para continuar.
      </p>

      {signedOut && (
        <div
          style={{
            color: "var(--green)",
            fontSize: 13,
            marginBottom: 18,
            padding: "10px 12px",
            background: "var(--green-soft)",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        >
          Sessao encerrada com sucesso.
        </div>
      )}

      {billingInactive && (
        <div
          style={{
            color: "var(--amber)",
            fontSize: 13,
            marginBottom: 18,
            padding: "10px 12px",
            background: "var(--amber-soft)",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        >
          Sua assinatura nao esta ativa para este acesso. Se precisar, revise
          os planos na LP e reative o checkout.
        </div>
      )}

      {supabaseSetupRequired && (
        <div
          style={{
            color: "var(--amber)",
            fontSize: 13,
            marginBottom: 18,
            padding: "10px 12px",
            background: "var(--amber-soft)",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        >
          {getSupabaseProductionSetupMessage()}
        </div>
      )}

      {supabaseSetupRequired && previewModeEnabled && (
        <div
          style={{
            color: "var(--accent)",
            fontSize: 13,
            marginBottom: 18,
            padding: "10px 12px",
            background: "var(--accent-soft)",
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        >
          Preview admin liberado neste ambiente para validacao interna. Use o
          e-mail <strong>{previewAdminEmail}</strong> com a senha operacional
          definida no Vercel.
        </div>
      )}

      {googleAuthEnabled ? (
        <>
          <button
            className="btn btn-secondary"
            style={{ width: "100%", height: 42, marginBottom: 10 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC04"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar com Google
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "16px 0",
              color: "var(--text-dim)",
              fontSize: 12,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            ou entre com e-mail
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
        </>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label">E-mail</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="field">
          <label className="field-label">
            Senha{" "}
            <Link
              href="/recuperar-senha"
              style={{
                float: "right",
                color: "var(--accent)",
                fontWeight: 500,
              }}
            >
              Esqueci minha senha
            </Link>
          </label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        {error && (
          <div
            style={{
              color: "var(--destructive, #ef4444)",
              fontSize: 13,
              marginBottom: 16,
              padding: "8px 12px",
              background: "rgba(239, 68, 68, 0.1)",
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: "100%", marginTop: 8 }}
          disabled={loading}
        >
          {loading ? (
            "Entrando..."
          ) : (
            <>
              {supabaseSetupRequired && previewModeEnabled
                ? "Entrar no preview"
                : "Entrar"}{" "}
              <Icon name="arrow-right" size={16} />
            </>
          )}
        </button>
      </form>

      <p
        className="muted"
        style={{ textAlign: "center", marginTop: 20, fontSize: 13 }}
      >
        Ainda nao contratou?{" "}
        <Link
          href="/#precos"
          style={{ color: "var(--accent)", fontWeight: 600 }}
        >
          Ver planos da LP
        </Link>
      </p>
    </>
  );
}
