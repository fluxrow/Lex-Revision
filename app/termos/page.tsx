import Link from "next/link";

export const metadata = {
  title: "Termos de Uso — Lex Revision",
  description:
    "Termos e condições para uso da plataforma Lex Revision, incluindo planos, responsabilidades e uso de IA.",
};

export default function TermsPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "48px 0", background: "var(--bg)" }}>
      <div style={{ width: "min(820px, calc(100vw - 32px))", margin: "0 auto" }}>
        <h1 style={{ fontSize: 40, letterSpacing: "-0.04em", marginBottom: 10 }}>
          Termos de uso
        </h1>
        <p className="muted" style={{ marginBottom: 28 }}>
          Versão 1.0 · Vigente a partir de 2026-06-18
        </p>

        <div className="card" style={{ lineHeight: 1.7 }}>
          <h2 style={{ fontSize: 22, marginTop: 0 }}>1. Quem é a operadora</h2>
          <p>
            O Lex Revision é operado pela{" "}
            <strong>Fluxrow Inteligência Criativa Ltda.</strong> ("Fluxrow"), inscrita no CNPJ{" "}
            <span className="mono">[CNPJ_FLUXROW_PLACEHOLDER]</span>, com sede no Brasil. Ao
            acessar ou usar a plataforma, você concorda com estes Termos.
          </p>

          <h2 style={{ fontSize: 22 }}>2. O que é o serviço</h2>
          <p>
            Plataforma SaaS para geração, revisão, versionamento e assinatura de contratos
            jurídicos, com suporte de Inteligência Artificial e integração com plataforma de
            assinatura digital certificada ICP-Brasil.
          </p>

          <h2 style={{ fontSize: 22 }}>3. Quem pode usar</h2>
          <ul>
            <li>Maior de 18 anos com capacidade civil plena</li>
            <li>Profissional do Direito ou usuário autorizado por escritório jurídico</li>
            <li>Aceita ser identificado pelo e-mail cadastrado</li>
          </ul>

          <h2 style={{ fontSize: 22 }}>4. Planos, preços e pagamento</h2>
          <p>
            Os planos vigentes (Starter, Professional, Firm) e respectivos valores em Reais estão
            descritos em <Link href="/#precos">nossa página de planos</Link>. O pagamento é
            processado mensalmente via Stripe, em moeda corrente nacional, com aceite de cartões e
            métodos disponíveis pela operadora.
          </p>
          <p>
            <strong>Trial:</strong> oferecemos avaliação gratuita por 7 dias para novos cadastros,
            sem exigir cartão de crédito. Ao final do período, a conta entra em estado de pausa
            até o usuário escolher um plano pago.
          </p>
          <p>
            <strong>Reajuste:</strong> os valores são reajustados anualmente pela variação positiva
            do IPCA acumulado ou por outro índice oficial substituto.
          </p>

          <h2 style={{ fontSize: 22 }}>5. Cancelamento e retenção</h2>
          <p>
            O usuário pode cancelar a qualquer momento via portal de billing (sem multa). Após o
            cancelamento, mantemos os dados por 12 meses para permitir reativação; após esse
            período os dados pessoais são anonimizados conforme a Política de Privacidade.
          </p>

          <h2 style={{ fontSize: 22 }}>6. Responsabilidade pelo conteúdo</h2>
          <p>
            <strong>Todo conteúdo jurídico gerado, revisado ou exportado pela plataforma é de
            responsabilidade exclusiva do usuário</strong>, que deve revisar antes de enviar,
            assinar ou executar qualquer contrato. O Lex Revision é uma ferramenta de apoio
            profissional, não substitui análise jurídica humana.
          </p>

          <h2 style={{ fontSize: 22 }}>7. Termo de uso da Inteligência Artificial</h2>
          <p>
            <strong>Seus dados não são usados para treinar modelos de IA.</strong> Operamos com
            Anthropic e Voyage AI sob contratos comerciais que garantem{" "}
            <em>zero data retention for training</em> — ou seja, o conteúdo dos contratos enviado
            ao modelo é processado apenas durante a requisição e não fica armazenado no provedor.
          </p>
          <p>
            A IA pode errar. Sugestões automáticas, classificações de risco e cláusulas geradas
            devem ser revisadas por profissional habilitado antes de uso real. A Fluxrow não se
            responsabiliza por consequências de uso direto de output da IA sem revisão.
          </p>

          <h2 style={{ fontSize: 22 }}>8. Propriedade intelectual</h2>
          <p>
            <strong>Do usuário:</strong> você mantém todos os direitos sobre os contratos, modelos
            e conteúdos que carrega ou cria na plataforma.
          </p>
          <p>
            <strong>Da Fluxrow:</strong> a marca, o software, os modelos compartilhados oferecidos
            pela plataforma e toda a tecnologia subjacente são propriedade da Fluxrow ou de seus
            licenciadores.
          </p>

          <h2 style={{ fontSize: 22 }}>9. Uso responsável</h2>
          <p>É proibido:</p>
          <ul>
            <li>Usar a plataforma para fins ilegais ou contrários à ética profissional</li>
            <li>Tentar acessar dados de outras organizações</li>
            <li>Usar engenharia reversa ou contornar limites técnicos</li>
            <li>Revender o acesso a terceiros sem autorização escrita</li>
            <li>Sobrecarregar a infraestrutura com requisições automatizadas fora dos limites do plano</li>
          </ul>
          <p>
            O descumprimento pode levar à suspensão ou encerramento da conta, sem direito a
            reembolso proporcional.
          </p>

          <h2 style={{ fontSize: 22 }}>10. Limitação de responsabilidade</h2>
          <p>
            A responsabilidade total da Fluxrow, por qualquer causa, está limitada ao valor pago
            pelo usuário nos 12 meses anteriores ao evento que originou a responsabilidade. Ficam
            excluídos lucros cessantes e danos indiretos, salvo nos casos de dolo ou culpa grave.
          </p>

          <h2 style={{ fontSize: 22 }}>11. Disponibilidade</h2>
          <p>
            Buscamos manter o serviço disponível, sem garantia de uptime 100%. Janelas de
            manutenção programadas serão comunicadas com antecedência razoável. Não há SLA
            contratual formal nos planos atuais.
          </p>

          <h2 style={{ fontSize: 22 }}>12. Alterações dos termos</h2>
          <p>
            Podemos atualizar estes Termos. Mudanças relevantes serão comunicadas por e-mail e
            apresentadas no próximo login. Uso continuado após o aviso equivale a aceitação.
          </p>

          <h2 style={{ fontSize: 22 }}>13. Lei aplicável e foro</h2>
          <p>
            Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca
            sede da Fluxrow para dirimir qualquer controvérsia, salvo disposição legal específica.
          </p>

          <h2 style={{ fontSize: 22 }}>14. Contato</h2>
          <p>
            Suporte: <a href="mailto:suporte@fluxrow.com">suporte@fluxrow.com</a>
            <br />
            Jurídico: <a href="mailto:juridico@fluxrow.com">juridico@fluxrow.com</a>
          </p>
        </div>

        <div className="row" style={{ gap: 10, marginTop: 20 }}>
          <Link href="/" className="btn btn-secondary" style={{ textDecoration: "none" }}>
            Voltar à LP
          </Link>
          <Link href="/privacidade" className="btn btn-ghost" style={{ textDecoration: "none" }}>
            Ver política de privacidade
          </Link>
        </div>
      </div>
    </main>
  );
}
