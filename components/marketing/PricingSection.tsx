"use client";

import Icon from "@/components/ui/Icon";
import { startTransition, useMemo, useState } from "react";

type PlanKey = "starter" | "professional" | "firm";

const PLANS: Array<{
  id: PlanKey;
  name: string;
  tag: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    id: "starter",
    name: "Starter",
    tag: "Solo",
    price: "97",
    description: "Para advogado ou operação pequena validando o fluxo.",
    features: [
      "20 contratos por mês",
      "IA para geração e revisão",
      "1 usuário",
      "Upload e preenchimento de modelos",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    tag: "Mais vendido",
    price: "297",
    description: "Para escritório com volume recorrente e time operacional.",
    features: [
      "100 contratos por mês",
      "Assinatura digital integrada",
      "5 usuários",
      "Histórico, clientes e faturamento",
    ],
    highlight: true,
  },
  {
    id: "firm",
    name: "Firm",
    tag: "Escala",
    price: "697",
    description: "Para equipe maior e operação mais robusta.",
    features: [
      "Volume ampliado",
      "Equipe expandida",
      "Base operacional completa",
      "Suporte prioritário",
    ],
  },
];

export default function PricingSection() {
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedLabel = useMemo(() => {
    if (!selectedPlan) {
      return null;
    }

    return PLANS.find((plan) => plan.id === selectedPlan)?.name ?? null;
  }, [selectedPlan]);

  const startCheckout = async (plan: PlanKey) => {
    setSelectedPlan(plan);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/stripe/create-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan,
            email: email || undefined,
            successPath: `/signup?checkout=success&plan=${plan}`,
            cancelPath: "/#precos",
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Nao foi possivel iniciar o checkout.");
        }

        if (!payload.url) {
          throw new Error("Checkout sem URL de redirecionamento.");
        }

        window.location.href = payload.url;
      } catch (err: any) {
        setSelectedPlan(null);
        setError(err.message || "Erro ao iniciar pagamento.");
      }
    });
  };

  return (
    <section id="precos" className="marketing-section">
      <div className="marketing-section-head">
        <div>
          <span className="chip chip-accent">Planos</span>
          <h2 className="marketing-section-title">Escolha um pacote e avance para o checkout.</h2>
        </div>
        <div>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>
            O fluxo principal do Lex fica aqui: a pessoa entende o produto, escolhe o plano, paga via Stripe e depois ativa o acesso.
          </p>
          <div style={{ marginTop: 14 }}>
            <label className="field-label" style={{ display: "block", marginBottom: 6 }}>
              E-mail para pre-preencher o checkout
            </label>
            <input
              className="input"
              type="email"
              placeholder="voce@seuescritorio.com.br"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="marketing-card-grid">
        {PLANS.map((plan) => {
          const loading = selectedPlan === plan.id;

          return (
            <article
              key={plan.id}
              className="card"
              style={{
                padding: 24,
                borderColor: plan.highlight ? "var(--accent)" : undefined,
                background: plan.highlight
                  ? "linear-gradient(180deg, var(--accent-soft), transparent)"
                  : undefined,
              }}
            >
              <div className="row sp-between" style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{plan.name}</div>
                <span className={`chip ${plan.highlight ? "chip-accent" : ""}`}>{plan.tag}</span>
              </div>

              <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em" }}>
                R$ {plan.price}
                <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>/mês</span>
              </div>

              <p
                className="muted"
                style={{ fontSize: 13.5, lineHeight: 1.7, margin: "10px 0 18px" }}
              >
                {plan.description}
              </p>

              <div className="col" style={{ gap: 8, marginBottom: 18 }}>
                {plan.features.map((feature) => (
                  <div key={feature} className="row" style={{ gap: 8, fontSize: 13.5 }}>
                    <Icon name="check" size={13} style={{ color: "var(--accent)" }} />
                    {feature}
                  </div>
                ))}
              </div>

              <button
                className={`btn ${plan.highlight ? "btn-primary" : "btn-secondary"} btn-lg`}
                style={{ width: "100%" }}
                onClick={() => startCheckout(plan.id)}
                disabled={loading}
              >
                {loading && selectedLabel === plan.name
                  ? "Abrindo checkout..."
                  : `Assinar ${plan.name}`}
              </button>
            </article>
          );
        })}
      </div>

      {error && (
        <div
          style={{
            color: "var(--red)",
            fontSize: 13,
            marginTop: 16,
            padding: "10px 12px",
            borderRadius: 10,
            background: "var(--red-soft)",
            border: "1px solid var(--border)",
          }}
        >
          {error}
        </div>
      )}
    </section>
  );
}
