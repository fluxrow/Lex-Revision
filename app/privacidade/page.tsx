import Link from "next/link";
import { fluxrowBranding } from "@/lib/legal/branding";

export const metadata = {
  title: "Política de Privacidade — Lex Revision",
  description:
    "Como o Lex Revision coleta, usa e protege seus dados pessoais e contratuais, em conformidade com a LGPD.",
};

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "48px 0", background: "var(--bg)" }}>
      <div style={{ width: "min(820px, calc(100vw - 32px))", margin: "0 auto" }}>
        <h1 style={{ fontSize: 40, letterSpacing: "-0.04em", marginBottom: 10 }}>
          Política de privacidade
        </h1>
        <p className="muted" style={{ marginBottom: 28 }}>
          Versão 1.0 · Vigente a partir de 2026-06-18 · Atualizado periodicamente
        </p>

        <div className="card" style={{ lineHeight: 1.7 }}>
          <h2 style={{ fontSize: 22, marginTop: 0 }}>1. Quem somos</h2>
          <p>
            O Lex Revision é uma plataforma operada pela{" "}
            <strong>{fluxrowBranding.legalName}</strong>, inscrita no CNPJ{" "}
            <span className="mono">{fluxrowBranding.cnpj}</span>, com sede em{" "}
            {fluxrowBranding.address}. Esta Política descreve como tratamos dados pessoais
            nos termos da Lei nº 13.709/2018 (LGPD).
          </p>

          <h2 style={{ fontSize: 22 }}>2. Quais dados coletamos</h2>
          <p><strong>Dados cadastrais:</strong> nome, e-mail, telefone, OAB (quando aplicável), CNPJ do escritório.</p>
          <p><strong>Dados de uso:</strong> contratos criados, modelos importados, histórico de revisões, IPs e timestamps de acesso para fins de auditoria.</p>
          <p><strong>Dados de pagamento:</strong> processados exclusivamente pela <strong>Stripe</strong>. Não armazenamos número de cartão em nossos sistemas.</p>
          <p><strong>Dados de assinatura digital:</strong> nome, e-mail e validações dos signatários quando o fluxo de assinatura é utilizado.</p>

          <h2 style={{ fontSize: 22 }}>3. Bases legais (Art. 7º LGPD)</h2>
          <ul>
            <li><strong>Execução de contrato</strong> com o titular (uso da plataforma)</li>
            <li><strong>Cumprimento de obrigação legal</strong> (retenção fiscal e regulatória)</li>
            <li><strong>Legítimo interesse</strong> (segurança, prevenção a fraudes, melhoria do serviço)</li>
            <li><strong>Consentimento</strong> (cookies não essenciais e comunicações de marketing)</li>
          </ul>

          <h2 style={{ fontSize: 22 }}>4. Como usamos seus dados</h2>
          <ul>
            <li>Autenticação e autorização no sistema</li>
            <li>Geração, revisão e versionamento dos seus contratos</li>
            <li>Processamento de pagamentos via Stripe</li>
            <li>Envio de assinaturas digitais via integração com plataforma certificada ICP-Brasil</li>
            <li>Comunicações operacionais (recuperação de senha, recibos, avisos críticos)</li>
            <li>Suporte e atendimento</li>
          </ul>

          <h2 style={{ fontSize: 22 }}>5. Com quem compartilhamos</h2>
          <p>Usamos subprocessadores selecionados para operar o serviço. Cada um tem contrato vigente com cláusulas LGPD/GDPR equivalentes:</p>
          <ul>
            <li><strong>Supabase</strong> (banco e autenticação) — hospedagem dos dados de aplicação</li>
            <li><strong>Vercel</strong> — hospedagem da aplicação web</li>
            <li><strong>Anthropic</strong> — provedor de IA (Claude). <strong>Veja a Seção 7 sobre uso da IA.</strong></li>
            <li><strong>Voyage AI</strong> — geração de embeddings para recuperação semântica</li>
            <li><strong>Stripe</strong> — processamento de pagamentos</li>
            <li><strong>Resend</strong> — envio de e-mails transacionais</li>
            <li><strong>Plataforma ICP-Brasil de assinatura</strong> — geração e verificação de assinaturas qualificadas</li>
          </ul>

          <h2 style={{ fontSize: 22 }}>6. Transferência internacional</h2>
          <p>
            Anthropic (EUA), Voyage AI (EUA), Vercel (EUA) e Stripe (EUA/IRL) operam fora do
            Brasil. Tais transferências ocorrem sob salvaguardas adequadas previstas no Art. 33 da
            LGPD, incluindo cláusulas contratuais padrão e padrões de adequação reconhecidos.
          </p>

          <h2 style={{ fontSize: 22 }}>7. Sobre o uso de IA</h2>
          <p>
            <strong>Seus dados não são usados para treinar modelos de IA de terceiros.</strong>{" "}
            Tanto a Anthropic quanto a Voyage AI possuem políticas contratuais expressas de
            <em> zero data retention for training</em> para clientes pagantes da API. Os textos dos
            seus contratos são enviados apenas para processamento em tempo real (geração, revisão,
            embedding) e não são retidos pelos provedores além do tempo da requisição.
          </p>
          <p>
            Você sempre pode pedir confirmação por escrito de não-treinamento em{" "}
            <a href="mailto:juridico@fluxrow.com">juridico@fluxrow.com</a>.
          </p>

          <h2 style={{ fontSize: 22 }}>8. Retenção de dados</h2>
          <ul>
            <li>Contratos e modelos: enquanto sua conta estiver ativa + 12 meses após cancelamento (para permitir reativação)</li>
            <li>Logs operacionais: 6 meses</li>
            <li>Logs de billing: 5 anos (obrigação fiscal)</li>
            <li>Após esses prazos, dados são anonimizados ou excluídos</li>
          </ul>

          <h2 style={{ fontSize: 22 }}>9. Seus direitos (Art. 18 LGPD)</h2>
          <p>Você pode a qualquer tempo solicitar:</p>
          <ul>
            <li>Confirmação da existência de tratamento</li>
            <li>Acesso aos dados</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados</li>
            <li>Anonimização, bloqueio ou eliminação de dados</li>
            <li>Portabilidade dos seus dados</li>
            <li>Eliminação dos dados tratados com base em consentimento</li>
            <li>Informação das entidades públicas e privadas com as quais compartilhamos seus dados</li>
            <li>Revogação do consentimento</li>
          </ul>
          <p>
            Para exercer qualquer direito, envie e-mail para{" "}
            <a href="mailto:privacidade@fluxrow.com">privacidade@fluxrow.com</a>. Respondemos em
            até 15 dias úteis.
          </p>

          <h2 style={{ fontSize: 22 }}>10. Segurança</h2>
          <p>Adotamos medidas técnicas e administrativas razoáveis:</p>
          <ul>
            <li>Comunicação cifrada (TLS 1.3) em todo o tráfego</li>
            <li>Senhas armazenadas com hash bcrypt via Supabase Auth</li>
            <li>Isolamento por <em>Row Level Security</em> entre organizações</li>
            <li>Webhooks com validação criptográfica de assinatura</li>
            <li>Princípio do menor privilégio nos acessos administrativos</li>
            <li>Auditoria periódica de credenciais</li>
          </ul>

          <h2 style={{ fontSize: 22 }}>11. Cookies</h2>
          <p>
            Usamos cookies essenciais para manter sua sessão. Detalhes e gestão de consentimento
            estão disponíveis no banner de cookies exibido em sua primeira visita.
          </p>

          <h2 style={{ fontSize: 22 }}>12. Alterações desta política</h2>
          <p>
            Atualizações relevantes serão comunicadas por e-mail e marcadas em destaque na próxima
            sessão após o login.
          </p>

          <h2 style={{ fontSize: 22 }}>13. Contato</h2>
          <p>
            Encarregado pelo Tratamento de Dados (DPO):{" "}
            <a href={`mailto:${fluxrowBranding.dpoEmail}`}>{fluxrowBranding.dpoEmail}</a>
            <br />
            Para outras questões:{" "}
            <a href={`mailto:${fluxrowBranding.privacyEmail}`}>
              {fluxrowBranding.privacyEmail}
            </a>
          </p>
        </div>

        <div className="row" style={{ gap: 10, marginTop: 20 }}>
          <Link href="/" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            Voltar à LP
          </Link>
          <Link href="/termos" className="btn btn-ghost" style={{ textDecoration: "none" }}>
            Ver termos de uso
          </Link>
        </div>
      </div>
    </main>
  );
}
