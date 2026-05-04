"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();

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
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error, data } = await supabase.auth.signUp({
        email,
        password: password || "temp-password-123", // since we don't have password field yet, using temp or we need to add a password field
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            company,
          }
        }
      });

      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
      }
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
          Criar conta
        </Link>
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Crie sua conta grátis</h2>
      <p className="muted" style={{ margin: '0 0 28px', fontSize: 14 }}>14 dias grátis · Sem cartão de crédito</p>

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
            <>Criar conta grátis <Icon name="arrow-right" size={16}/></>
          )}
        </button>
      </form>

      <p className="dim" style={{ textAlign: 'center', marginTop: 16, fontSize: 11.5, lineHeight: 1.5 }}>
        Ao criar conta você concorda com os <a href="#" style={{color:'var(--text-muted)', textDecoration:'underline'}}>Termos</a> e <a href="#" style={{color:'var(--text-muted)', textDecoration:'underline'}}>Privacidade</a>.
      </p>
    </>
  );
}
