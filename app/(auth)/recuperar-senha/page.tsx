"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Icon from "@/components/ui/Icon";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupRecoveryListener = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setRecoveryMode(true);
          setMessage("Defina sua nova senha para concluir a recuperacao.");
        }
      });

      unsubscribe = () => data.subscription.unsubscribe();

      if (window.location.search.includes("mode=reset")) {
        setRecoveryMode(true);
      }
    };

    setupRecoveryListener();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/recuperar-senha?mode=reset`;
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

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      if (newPassword.length < 8) {
        throw new Error("Use pelo menos 8 caracteres para a nova senha.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("As senhas nao conferem.");
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        throw updateError;
      }

      setMessage("Senha atualizada. Voce ja pode entrar com a nova senha.");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        window.location.assign("/login");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Nao foi possivel atualizar a senha.");
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

      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
        {recoveryMode ? "Definir nova senha" : "Recuperar acesso"}
      </h2>
      <p className="muted" style={{ margin: "0 0 28px", fontSize: 14 }}>
        {recoveryMode
          ? "Crie uma nova senha para voltar ao painel."
          : "Informe o e-mail da sua conta para receber o link de redefinicao."}
      </p>

      {recoveryMode ? (
        <form onSubmit={updatePassword}>
          <div className="field">
            <label className="field-label">Nova senha</label>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={loading}
                style={{ paddingRight: 46 }}
              />
              <PasswordToggle
                visible={showNewPassword}
                onClick={() => setShowNewPassword((current) => !current)}
                disabled={loading}
              />
            </div>
          </div>
          <div className="field">
            <label className="field-label">Confirmar senha</label>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={loading}
                style={{ paddingRight: 46 }}
              />
              <PasswordToggle
                visible={showConfirmPassword}
                onClick={() => setShowConfirmPassword((current) => !current)}
                disabled={loading}
              />
            </div>
          </div>
          <Feedback error={error} message={message} />
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
            {loading ? "Atualizando..." : <>Salvar nova senha <Icon name="arrow-right" size={16} /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={requestReset}>
          <div className="field">
            <label className="field-label">E-mail</label>
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} />
          </div>
          <Feedback error={error} message={message} />
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: 8 }} disabled={loading}>
            {loading ? "Enviando..." : <>Enviar link <Icon name="arrow-right" size={16} /></>}
          </button>
        </form>
      )}
    </>
  );
}

function PasswordToggle({
  visible,
  onClick,
  disabled,
}: {
  visible: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
      title={visible ? "Ocultar senha" : "Mostrar senha"}
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "absolute",
        right: 8,
        top: "50%",
        transform: "translateY(-50%)",
        width: 32,
        height: 32,
        border: 0,
        borderRadius: 8,
        background: "transparent",
        color: "var(--text-muted)",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={visible ? "eye-off" : "eye"} size={16} />
    </button>
  );
}

function Feedback({ error, message }: { error: string | null; message: string | null }) {
  return (
    <>
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
    </>
  );
}
