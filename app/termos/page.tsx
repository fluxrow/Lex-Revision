import Link from "next/link";

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "48px 0", background: "var(--bg)" }}>
      <div style={{ width: "min(760px, calc(100vw - 32px))", margin: "0 auto" }}>
        <h1 style={{ fontSize: 40, letterSpacing: "-0.04em", marginBottom: 10 }}>Termos de uso</h1>
        <p className="muted" style={{ marginBottom: 28 }}>
          Versão operacional inicial do Lex Revision para testes controlados e uso da plataforma.
        </p>
        <div className="card" style={{ lineHeight: 1.7 }}>
          <p>O Lex Revision oferece recursos de operação contratual, automação, revisão e organização documental para escritórios e equipes jurídicas.</p>
          <p>O usuário é responsável por revisar o conteúdo jurídico gerado, configurado ou importado antes de qualquer envio, assinatura ou execução.</p>
          <p>Durante a fase atual do produto, alguns recursos podem operar em rollout gradual, inclusive integrações externas e trilhas de beta controlado por voucher.</p>
          <p>O uso da plataforma deve respeitar a legislação aplicável, a política interna do escritório e as boas práticas profissionais.</p>
          <p>Para suporte operacional, cobrança ou acesso, use os canais definidos pela equipe Fluxrow durante o onboarding.</p>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 20 }}>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>Voltar ao login</Link>
          <Link href="/" className="btn btn-secondary" style={{ textDecoration: "none" }}>Voltar à LP</Link>
        </div>
      </div>
    </main>
  );
}
