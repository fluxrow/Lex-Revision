// Auth page: Login + Cadastro, split-screen with marketing panel on the left

function AuthPage({ mode = 'login', onDone }) {
  const [tab, setTab] = React.useState(mode);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 560px)',
      minHeight: '100vh',
      background: 'var(--bg)',
    }} className="auth-grid">
      <style>{`
        @media (max-width: 880px) { .auth-grid { grid-template-columns: 1fr !important; } .auth-left { display: none !important; } }
      `}</style>

      {/* Marketing panel */}
      <div className="auth-left" style={{
        position: 'relative',
        background: `
          radial-gradient(ellipse at 20% 0%, var(--accent-glow), transparent 60%),
          radial-gradient(ellipse at 100% 100%, rgba(91,111,209,0.18), transparent 60%),
          var(--bg-deep)
        `,
        padding: '60px 56px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', zIndex: 2 }}>
          <div className="sidebar-logo-mark" style={{ width: 36, height: 36, fontSize: 18 }}>L</div>
          Lex<span style={{ color: 'var(--accent)' }}> Revision</span>
        </div>

        <div style={{ zIndex: 2 }}>
          <div style={{
            fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em',
            lineHeight: 1.1, marginBottom: 20, color: 'var(--text)',
            textWrap: 'balance',
          }}>
            Contratos prontos em <span style={{ color: 'var(--accent)' }}>minutos</span>, não em horas.
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 16, lineHeight: 1.5, maxWidth: 460, marginBottom: 32 }}>
            Automação de contratos para escritórios de advocacia. Upload, preenchimento inteligente, IA jurídica e assinatura digital — tudo em um só lugar.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 520 }}>
            {[
              { icon: 'bolt',    label: '98% mais rápido' },
              { icon: 'sparkle', label: 'IA treinada em direito BR' },
              { icon: 'shield',  label: 'LGPD + ICP-Brasil' },
              { icon: 'pen',     label: 'Assinatura digital nativa' },
            ].map((f, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}>
                <Icon name={f.icon} size={18} style={{ color: 'var(--accent)' }}/>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', fontSize: 13, zIndex: 2 }}>
          <div style={{ display: 'flex' }}>
            {['MR','JP','AC','+'].map((l, i) => (
              <div key={i} className="avatar sm" style={{
                marginLeft: i === 0 ? 0 : -8,
                border: '2px solid var(--bg-deep)',
                background: i === 3 ? 'var(--surface-3)' : undefined,
                color: i === 3 ? 'var(--text-muted)' : undefined,
              }}>{l}</div>
            ))}
          </div>
          Usado por 400+ escritórios no Brasil
        </div>
      </div>

      {/* Form */}
      <div style={{
        background: 'var(--bg)',
        padding: '60px 48px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
          <div style={{
            display: 'flex', gap: 4,
            padding: 4,
            background: 'var(--surface-2)',
            borderRadius: 10,
            marginBottom: 28,
          }}>
            {[['login','Entrar'], ['signup','Criar conta']].map(([k, l]) => (
              <div key={k} onClick={() => setTab(k)}
                style={{
                  flex: 1, textAlign: 'center',
                  padding: '9px 12px',
                  borderRadius: 7,
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                  background: tab === k ? 'var(--surface)' : 'transparent',
                  color: tab === k ? 'var(--text)' : 'var(--text-muted)',
                  boxShadow: tab === k ? 'var(--shadow-sm)' : 'none',
                }}>{l}</div>
            ))}
          </div>

          {tab === 'login' ? <LoginForm onDone={onDone}/> : <SignupForm onDone={onDone}/>}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onDone }) {
  return (
    <>
      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
        Bem-vindo de volta
      </h2>
      <p className="muted" style={{ margin: '0 0 28px', fontSize: 14 }}>
        Continue de onde parou
      </p>

      <button className="btn btn-secondary" style={{ width: '100%', height: 42, marginBottom: 10 }}>
        <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continuar com Google
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0', color: 'var(--text-dim)', fontSize: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
        ou entre com e-mail
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
      </div>

      <div className="field">
        <label className="field-label">E-mail</label>
        <input className="input" type="email" defaultValue="marina@silvaadv.com"/>
      </div>
      <div className="field">
        <label className="field-label">
          Senha
          <a href="#" style={{ float: 'right', color: 'var(--accent)', fontWeight: 500 }}>Esqueci minha senha</a>
        </label>
        <input className="input" type="password" defaultValue="••••••••••"/>
      </div>

      <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }}
        onClick={() => onDone && onDone()}>
        Entrar <Icon name="arrow-right" size={16}/>
      </button>

      <p className="muted" style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
        Não tem conta? <a href="#" style={{color:'var(--accent)', fontWeight: 600}}>Criar conta grátis</a>
      </p>
    </>
  );
}

function SignupForm({ onDone }) {
  return (
    <>
      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
        Crie sua conta grátis
      </h2>
      <p className="muted" style={{ margin: '0 0 28px', fontSize: 14 }}>
        14 dias grátis · Sem cartão de crédito
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="field" style={{margin:0}}><label className="field-label">Nome</label><input className="input" defaultValue="Marina"/></div>
        <div className="field" style={{margin:0}}><label className="field-label">Sobrenome</label><input className="input" defaultValue="Rocha"/></div>
      </div>
      <div className="field" style={{marginTop: 12}}>
        <label className="field-label">Escritório</label>
        <input className="input" placeholder="Ex: Silva & Associados"/>
      </div>
      <div className="field">
        <label className="field-label">E-mail profissional</label>
        <input className="input" type="email" placeholder="voce@seuescritorio.com.br"/>
      </div>
      <div className="field">
        <label className="field-label">OAB (opcional)</label>
        <input className="input" placeholder="Ex: SP 123.456"/>
      </div>

      <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }}
        onClick={() => onDone && onDone()}>
        Criar conta grátis <Icon name="arrow-right" size={16}/>
      </button>

      <p className="dim" style={{ textAlign: 'center', marginTop: 16, fontSize: 11.5, lineHeight: 1.5 }}>
        Ao criar conta você concorda com os <a href="#" style={{color:'var(--text-muted)', textDecoration:'underline'}}>Termos</a> e <a href="#" style={{color:'var(--text-muted)', textDecoration:'underline'}}>Privacidade</a>.
      </p>
    </>
  );
}

window.AuthPage = AuthPage;
