import PricingSection from "@/components/marketing/PricingSection";
import Icon from "@/components/ui/Icon";
import Link from "next/link";

const highlights = [
  "Upload de .docx com variáveis detectadas",
  "IA para gerar, revisar e traduzir contratos",
  "Assinatura digital integrada no mesmo fluxo",
  "Biblioteca de modelos para o escritório inteiro",
];

const metrics = [
  { value: "2 min", label: "para sair do rascunho ao contrato pronto" },
  { value: "3 planos", label: "para solo, equipe e operação maior" },
  { value: "1 fluxo", label: "de venda, cobrança e ativação de acesso" },
];

const features = [
  {
    icon: "upload",
    title: "Suba um modelo e reutilize",
    body: "Importe contratos existentes em .docx, detecte variáveis e transforme o que hoje está espalhado em Word num fluxo padronizado.",
  },
  {
    icon: "sparkle",
    title: "Use IA no ponto certo",
    body: "Gere primeiras versões, revise cláusulas de risco e traduza conteúdo jurídico sem sair do ambiente do contrato.",
  },
  {
    icon: "pen",
    title: "Feche no mesmo lugar",
    body: "Envie para assinatura digital, acompanhe status dos signatários e concentre histórico, contratos e faturamento num único produto.",
  },
];

const steps = [
  {
    id: "01",
    title: "Escolha como começar",
    body: "Upload de modelo, biblioteca interna ou geração guiada por IA.",
  },
  {
    id: "02",
    title: "Preencha e revise",
    body: "Ajuste variáveis, refine cláusulas e valide o texto com apoio da IA.",
  },
  {
    id: "03",
    title: "Envie para assinatura",
    body: "Acompanhe abertura, visualização e assinatura sem trocar de ferramenta.",
  },
];

export default function HomePage() {
  return (
    <>
      <style>{`
        .marketing-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, var(--accent-glow), transparent 28%),
            radial-gradient(circle at 85% 12%, rgba(124, 224, 166, 0.12), transparent 22%),
            linear-gradient(180deg, var(--bg-deep) 0%, var(--bg) 26%, var(--bg) 100%);
        }
        .marketing-wrap {
          width: min(1180px, calc(100vw - 32px));
          margin: 0 auto;
        }
        .marketing-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 22px 0;
        }
        .marketing-nav-links {
          display: flex;
          align-items: center;
          gap: 20px;
          color: var(--text-muted);
          font-size: 13px;
        }
        .marketing-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
          gap: 34px;
          padding: 40px 0 72px;
          align-items: center;
        }
        .marketing-headline {
          font-size: clamp(42px, 7vw, 76px);
          line-height: 0.96;
          letter-spacing: -0.05em;
          margin: 16px 0 18px;
          max-width: 10ch;
        }
        .marketing-copy {
          font-size: 17px;
          color: var(--text-muted);
          line-height: 1.7;
          max-width: 58ch;
          margin: 0 0 28px;
        }
        .marketing-cta-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 26px;
        }
        .marketing-proof {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }
        .marketing-panel {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          border: 1px solid var(--border);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0)),
            var(--surface);
          box-shadow: var(--shadow-lg);
          padding: 22px;
        }
        .marketing-panel::after {
          content: "";
          position: absolute;
          inset: auto -80px -80px auto;
          width: 220px;
          height: 220px;
          background: var(--accent-glow);
          filter: blur(80px);
          opacity: 0.7;
          pointer-events: none;
        }
        .marketing-panel-grid {
          display: grid;
          gap: 14px;
          position: relative;
          z-index: 1;
        }
        .marketing-mini-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .marketing-section {
          padding: 28px 0 72px;
        }
        .marketing-section-head {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 340px);
          gap: 24px;
          align-items: end;
          margin-bottom: 24px;
        }
        .marketing-section-title {
          font-size: clamp(28px, 4vw, 44px);
          letter-spacing: -0.04em;
          line-height: 1.02;
          margin: 10px 0 0;
          max-width: 12ch;
        }
        .marketing-card-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .marketing-step-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        .marketing-cta-banner {
          padding: 28px;
          border-radius: 24px;
          border: 1px solid var(--border);
          background:
            radial-gradient(circle at top right, rgba(143, 163, 245, 0.18), transparent 30%),
            linear-gradient(135deg, var(--surface), var(--surface-2));
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }
        @media (max-width: 980px) {
          .marketing-nav { padding-top: 16px; }
          .marketing-nav-links { display: none; }
          .marketing-hero,
          .marketing-section-head,
          .marketing-card-grid,
          .marketing-step-grid {
            grid-template-columns: 1fr;
          }
          .marketing-proof,
          .marketing-mini-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <main className="marketing-shell">
        <div className="marketing-wrap">
          <nav className="marketing-nav">
            <Link href="/" className="sidebar-logo" style={{ padding: 0 }}>
              <div className="sidebar-logo-mark">L</div>
              <div className="sidebar-logo-text">
                Lex<span className="legal"> Revision</span>
              </div>
            </Link>

            <div className="marketing-nav-links">
              <a href="#produto">Produto</a>
              <a href="#precos">Preços</a>
              <a href="#fluxo">Fluxo</a>
            </div>

            <div className="row" style={{ gap: 10 }}>
              <a href="#precos" className="btn btn-primary">
                Ver planos
              </a>
              <Link href="/login" className="btn btn-ghost">
                Já sou cliente
              </Link>
            </div>
          </nav>

          <section className="marketing-hero">
            <div>
              <span className="chip chip-accent">Plataforma para escritórios que precisam escalar contratos</span>
              <h1 className="marketing-headline">
                Contratos prontos em minutos, não em horas.
              </h1>
              <p className="marketing-copy">
                O Lex Revision junta modelo, IA, revisão e assinatura digital no mesmo fluxo. Em vez de alternar entre Word,
                e-mail, ferramenta de assinatura e retrabalho manual, o escritório opera tudo num só lugar.
              </p>

              <div className="marketing-cta-row">
                <a href="#precos" className="btn btn-primary btn-lg">
                  Escolher plano <Icon name="arrow-right" size={16} />
                </a>
                <Link href="/login" className="btn btn-secondary btn-lg">
                  Entrar como cliente
                </Link>
              </div>

              <div className="marketing-proof">
                {metrics.map((metric) => (
                  <div key={metric.label} className="card" style={{ padding: 16 }}>
                    <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.04em" }}>{metric.value}</div>
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="marketing-panel">
              <div className="marketing-panel-grid">
                <div className="row sp-between" style={{ alignItems: "flex-start" }}>
                  <div>
                    <div className="chip chip-green">Workspace ativo</div>
                    <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 14 }}>
                      Fluxo jurídico em um cockpit só
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="sparkle" size={20} />
                  </div>
                </div>

                <div className="marketing-mini-grid">
                  <div className="card" style={{ padding: 16, background: "var(--surface-2)" }}>
                    <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                      <Icon name="upload" size={15} style={{ color: "var(--accent)" }} />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>Upload e variáveis</span>
                    </div>
                    <div className="muted" style={{ fontSize: 12.5 }}>
                      Detecte campos como <span className="mono">{"{{CLIENTE}}"}</span> e reaproveite o mesmo modelo sem refazer do zero.
                    </div>
                  </div>

                  <div className="card" style={{ padding: 16, background: "var(--surface-2)" }}>
                    <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                      <Icon name="shield" size={15} style={{ color: "var(--green)" }} />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>Trilha de revisão</span>
                    </div>
                    <div className="muted" style={{ fontSize: 12.5 }}>
                      Revise cláusulas, centralize histórico e mantenha o trabalho do time rastreável.
                    </div>
                  </div>
                </div>

                <div className="card" style={{ padding: 18, background: "linear-gradient(135deg, var(--surface-2), transparent)" }}>
                  <div className="row sp-between" style={{ marginBottom: 12 }}>
                    <div>
                      <div className="card-title">O que já existe no app</div>
                      <div className="card-sub" style={{ marginBottom: 0 }}>
                        Dashboard, histórico, IA, modelos, faturamento e fluxo de assinatura
                      </div>
                    </div>
                    <span className="chip chip-accent">MVP operacional</span>
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {highlights.map((item) => (
                      <div key={item} className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 22, height: 22, borderRadius: 999, background: "var(--green-soft)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon name="check" size={12} />
                        </div>
                        <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>{item}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="produto" className="marketing-section">
            <div className="marketing-section-head">
              <div>
                <span className="chip">Produto</span>
                <h2 className="marketing-section-title">O que o Anty já trouxe para a base atual.</h2>
              </div>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                O protótipo foi portado para Next.js e já virou um app navegável. O próximo passo é sair do modo demo e fechar auth,
                persistência real, billing e webhooks.
              </p>
            </div>

            <div className="marketing-card-grid">
              {features.map((feature) => (
                <article key={feature.title} className="card">
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <Icon name={feature.icon} size={18} />
                  </div>
                  <div className="card-title" style={{ fontSize: 18, marginBottom: 8 }}>{feature.title}</div>
                  <div className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>{feature.body}</div>
                </article>
              ))}
            </div>
          </section>

          <PricingSection />

          <section id="fluxo" className="marketing-section">
            <div className="marketing-section-head">
              <div>
                <span className="chip chip-green">Fluxo</span>
                <h2 className="marketing-section-title">Venda primeiro. Acesso depois.</h2>
              </div>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                O fluxo certo do produto é LP, plano, pagamento, ativação e só então plataforma. O login fica para cliente já ativo.
              </p>
            </div>

            <div className="marketing-step-grid">
              {steps.map((step) => (
                <article key={step.id} className="card" style={{ padding: 22 }}>
                  <div className="mono" style={{ fontSize: 13, color: "var(--accent)", marginBottom: 16 }}>{step.id}</div>
                  <div className="card-title" style={{ fontSize: 18, marginBottom: 8 }}>{step.title}</div>
                  <div className="muted" style={{ fontSize: 14, lineHeight: 1.7 }}>{step.body}</div>
                </article>
              ))}
            </div>
          </section>

          <section className="marketing-section" style={{ paddingBottom: 88 }}>
            <div className="marketing-cta-banner">
              <div>
                <div className="chip chip-amber" style={{ marginBottom: 12 }}>Acesso à plataforma</div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>
                  Cliente existente entra pelo login. Novo cliente entra pelo checkout.
                </div>
                <div className="muted" style={{ fontSize: 14, lineHeight: 1.7, maxWidth: "60ch" }}>
                  Isso evita inverter aquisição com uso do produto e deixa a narrativa comercial muito mais limpa.
                </div>
              </div>

              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                <a href="#precos" className="btn btn-primary">Ir para preços</a>
                <Link href="/login" className="btn btn-secondary">Login de clientes</Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
