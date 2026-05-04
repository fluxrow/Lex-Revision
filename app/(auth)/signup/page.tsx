"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get("checkout") === "success";
  const selectedPlan = searchParams.get("plan");
  const sessionId = searchParams.get("session_id");
  const activationRequired = searchParams.get("activation") === "required";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!sessionId) {
        throw new Error("Finalize o checkout da LP antes de ativar seu acesso.");
      }

      const activationResponse = await fetch("/api/auth/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          email,
          password,
          firstName,
          lastName,
          company,
        }),
      });

      const activationPayload = await activationResponse.json();
      if (!activationResponse.ok) {
        if (activationPayload.redirectTo) {
          router.replace(activationPayload.redirectTo);
          return;
        }

        throw new Error(activationPayload.error || "Nao foi possivel ativar o acesso.");
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to connect to Supabase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--surface-2)', borderRadius: 10, marginBottom: 28 }}>
        <Link href="/login" style={{ flex: 1, textAlign: 'center', padding: '9px 12px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)' }}>
          Entrar
        </Link>
        <Link href="/signup" style={{ flex: 1, textAlign: 'center', padding: '9px 12px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text)', boxShadow: 'var(--shadow-sm)', textDecoration: 'none' }}>
          Ativar acesso
        </Link>
      </div>

      {checkoutSuccess && (
        <div style={{ color: 'var(--green)', fontSize: 13, marginBottom: 18, padding: '10px 12px', background: 'var(--green-soft)', borderRadius: 8, border: '1px solid var(--border)' }}>
          Checkout iniciado com sucesso{selectedPlan ? ` para o plano ${selectedPlan}` : ""}. Agora crie seu acesso para entrar na plataforma.
        </div>
      )}

      {activationRequired && !checkoutSuccess && (
        <div style={{ color: 'var(--amber)', fontSize: 13, marginBottom: 18, padding: '10px 12px', background: 'var(--amber-soft)', borderRadius: 8, border: '1px solid var(--border)' }}>
          Sua conta ainda nao foi ativada. Finalize um checkout valido na LP para liberar acesso.
        </div>
      )}

      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Ative seu acesso</h2>
      <p className="muted" style={{ margin: '0 0 28px', fontSize: 14 }}>
        Se você ainda não contratou um plano, volte para a <Link href="/#precos" style={{color:'var(--accent)', fontWeight: 600}}>LP e escolha um pacote</Link>.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="field" style={{margin:0}}>
            <label className="field-label">Nome</label>
            <input className="input" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={loading} />
          </div>
          <div className="field" style={{margin:0}}>
             <label className="field-label">Sobrenome</label>
             <input className="input" value={lastName} onChange={e => setLastName(e.target.value)} disabled={loading} />
          </div>
        </div>
        <div className="field" style={{marginTop: 12}}>
          <label className="field-label">Escritório</label>
          <input className="input" placeholder="Ex: Silva & Associados" value={company} onChange={e => setCompany(e.target.value)} disabled={loading} />
        </div>
        <div className="field">
          <label className="field-label">E-mail profissional</label>
          <input className="input" type="email" placeholder="voce@seuescritorio.com.br" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
        </div>
        <div className="field">
          <label className="field-label">Senha</label>
          <input className="input" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
        </div>
        {error && (
          <div style={{ color: 'var(--destructive, #ef4444)', fontSize: 13, marginBottom: 16, padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6 }}>
            {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
          {loading ? 'Criando...' : (
            <>Criar acesso <Icon name="arrow-right" size={16}/></>
          )}
        </button>
      </form>

      {!sessionId && (
        <p className="muted" style={{ textAlign: 'center', marginTop: 14, fontSize: 12.5 }}>
          Esta tela depende de um checkout valido. Se ainda nao contratou, volte para a <Link href="/#precos" style={{color:'var(--accent)', fontWeight: 600}}>LP e escolha um plano</Link>.
        </p>
      )}

      <p className="dim" style={{ textAlign: 'center', marginTop: 16, fontSize: 11.5, lineHeight: 1.5 }}>
        Ao criar conta você concorda com os <a href="#" style={{color:'var(--text-muted)', textDecoration:'underline'}}>Termos</a> e <a href="#" style={{color:'var(--text-muted)', textDecoration:'underline'}}>Privacidade</a>.
      </p>
    </>
  );
}
