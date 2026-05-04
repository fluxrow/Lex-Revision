import Icon from "@/components/ui/Icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 560px)',
      minHeight: '100vh', background: 'var(--bg)',
    }} className="auth-grid">
      <style>{`@media (max-width: 880px) { .auth-grid { grid-template-columns: 1fr !important; } .auth-left { display: none !important; } }`}</style>
      
      {/* Marketing panel */}
      <div className="auth-left" style={{
        position: 'relative',
        background: `radial-gradient(ellipse at 20% 0%, var(--accent-glow), transparent 60%), radial-gradient(ellipse at 100% 100%, rgba(91,111,209,0.18), transparent 60%), var(--bg-deep)`,
        padding: '60px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', zIndex: 2 }}>
          <div className="sidebar-logo-mark" style={{ width: 36, height: 36, fontSize: 18, background: 'var(--accent)', color: '#000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>L</div>
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
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 10,
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
                marginLeft: i === 0 ? 0 : -8, border: '2px solid var(--bg-deep)',
                background: i === 3 ? 'var(--surface-3)' : undefined, color: i === 3 ? 'var(--text-muted)' : undefined,
              }}>{l}</div>
            ))}
          </div>
          Usado por 400+ escritórios no Brasil
        </div>
      </div>
      
      {/* Form */}
      <div style={{ background: 'var(--bg)', padding: '60px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ maxWidth: 380, width: '100%', margin: '0 auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
