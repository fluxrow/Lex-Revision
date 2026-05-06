import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "48px 0", background: "var(--bg)" }}>
      <div style={{ width: "min(760px, calc(100vw - 32px))", margin: "0 auto" }}>
        <h1 style={{ fontSize: 40, letterSpacing: "-0.04em", marginBottom: 10 }}>Política de privacidade</h1>
        <p className="muted" style={{ marginBottom: 28 }}>
          Resumo operacional de tratamento de dados para a fase atual do Lex Revision.
        </p>
        <div className="card" style={{ lineHeight: 1.7 }}>
          <p>O Lex Revision trata dados cadastrais, dados operacionais de contratos, membros e clientes para viabilizar o uso da plataforma.</p>
          <p>Arquivos, textos e metadados enviados pelo usuário podem ser processados por serviços internos e integrações técnicas ligadas à operação documental.</p>
          <p>O acesso administrativo é controlado por autenticação, memberships e políticas de isolamento por organização.</p>
          <p>Durante betas controlados, vouchers podem ser emitidos para liberar acesso sem cobrança, sempre vinculados a um e-mail específico.</p>
          <p>Pedidos operacionais sobre acesso, correção ou suporte devem seguir os canais definidos com a equipe Fluxrow.</p>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 20 }}>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: "none" }}>Voltar ao login</Link>
          <Link href="/" className="btn btn-secondary" style={{ textDecoration: "none" }}>Voltar à LP</Link>
        </div>
      </div>
    </main>
  );
}
