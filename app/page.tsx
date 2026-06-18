import PricingSection from "@/components/marketing/PricingSection";
import Icon from "@/components/ui/Icon";
import Link from "next/link";

const highlights = [
  "Importa seu modelo de contrato em .docx e detecta as variáveis",
  "IA jurídica em português gera, revisa e identifica cláusulas faltantes",
  "Assinatura digital ICP-Brasil — cliente assina pelo celular em 1 clique",
  "Biblioteca de modelos compartilhada com todo o escritório",
];

const metrics = [
  { value: "4h → 12min", label: "tempo médio para fechar um contrato" },
  { value: "ICP-Brasil", label: "assinatura com validade jurídica plena" },
  { value: "7 dias grátis", label: "sem cartão · cancela em 1 clique" },
];

const features = [
  {
    icon: "upload",
    title: "Seu modelo, 10x mais reaproveitável",
    body: "Importa qualquer contrato em Word, marca as variáveis em segundos, e seu time inteiro passa a usar o mesmo padrão — sem mais 'qual é a versão certa?' no Drive.",
  },
  {
    icon: "sparkle",
    title: "Primeiro rascunho pronto em 30 segundos",
    body: "IA jurídica nativa em português que gera contratos completos, revisa contra cláusulas-padrão do mercado brasileiro e identifica lacunas críticas. Você só revisa o que importa.",
  },
  {
    icon: "pen",
    title: "Cliente assina pelo celular, na mesma reunião",
    body: "Assinatura ICP-Brasil integrada. Você manda o link, ele clica, assina, pronto. Sem trocar de ferramenta, sem PDF perdido no e-mail, sem esperar 3 semanas.",
  },
];

const steps = [
  {
    id: "01",
    title: "Crie o contrato em 3 cliques",
    body: "Suba seu modelo, escolha da biblioteca ou peça pra IA gerar do zero.",
  },
  {
    id: "02",
    title: "Revise sem digitar do zero",
    body: "A IA já preencheu, revisou contra padrões e sinalizou riscos. Você só ajusta o que precisa.",
  },
  {
    id: "03",
    title: "Envie e feche o negócio",
    body: "Link de assinatura no WhatsApp do cliente. Assina pelo celular. Você é notificado na hora.",
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
                Começar grátis
              </a>
              <Link href="/login" className="btn btn-ghost">
                Já sou cliente
              </Link>
            </div>
          </nav>

          <section className="marketing-hero">
            <div>
              <span className="chip chip-accent">Para advogados que cansaram do Word</span>
              <h1 className="marketing-headline">
                Pare de redigir contratos no Word.
              </h1>
              <p className="marketing-copy">
                Gere, revise e envie para assinatura em minutos — não em horas. O Lex Revision junta IA jurídica em português,
                biblioteca de modelos e assinatura digital ICP-Brasil em um fluxo único, sem trocar de ferramenta.
              </p>

              <div className="marketing-cta-row">
                <a href="#precos" className="btn btn-primary btn-lg">
                  Começar grátis <Icon name="arrow-right" size={16} />
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
                    <div className="chip chip-green">Pronto para usar</div>
                    <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 14 }}>
                      Tudo do contrato em um lugar só
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
                      <div className="card-title">O que você ganha no plano</div>
                      <div className="card-sub" style={{ marginBottom: 0 }}>
                        Modelos, IA, revisão, assinatura, histórico e faturamento — tudo incluso
                      </div>
                    </div>
                    <span className="chip chip-accent">Disponível agora</span>
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
                <h2 className="marketing-section-title">Você passa metade do dia caçando contrato no Drive.</h2>
              </div>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                Cláusula desatualizada. Versão errada enviada pro cliente. Assinatura que demora 3 semanas. Cliente que desiste porque o processo é lento demais.
                Enquanto isso, seu escritório tenta crescer com o mesmo time.
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
                <span className="chip chip-green">Como funciona</span>
                <h2 className="marketing-section-title">Do brief à assinatura, sem trocar de tela.</h2>
              </div>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                Três passos. Nenhum exporta-importa-cola. O contrato nasce, vive e fecha no mesmo lugar.
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
                <div className="chip chip-amber" style={{ marginBottom: 12 }}>Comece hoje</div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>
                  Seu primeiro contrato sai antes do café esfriar.
                </div>
                <div className="muted" style={{ fontSize: 14, lineHeight: 1.7, maxWidth: "60ch" }}>
                  7 dias por nossa conta. Sem cartão de crédito. Cancela em 1 clique se não for pra você.
                </div>
              </div>

              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                <a href="#precos" className="btn btn-primary">Começar grátis</a>
                <Link href="/login" className="btn btn-secondary">Já sou cliente</Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
