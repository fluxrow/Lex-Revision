import Link from "next/link";

import type { OnboardingStep } from "@/lib/account/overview";
import Icon from "@/components/ui/Icon";

type AccountStatusBannerProps = {
  organizationName: string;
  planLabel: string;
  statusLabel: string;
  statusTone: "healthy" | "warning" | "setup";
  progressPercent: number;
  completedSteps: number;
  totalSteps: number;
  nextStep: OnboardingStep | null;
};

export default function AccountStatusBanner({
  organizationName,
  planLabel,
  statusLabel,
  statusTone,
  progressPercent,
  completedSteps,
  totalSteps,
  nextStep,
}: AccountStatusBannerProps) {
  const toneStyles =
    statusTone === "warning"
      ? {
          background: "linear-gradient(135deg, var(--amber-soft), transparent)",
          borderColor: "var(--amber)",
          chipClass: "chip chip-amber",
        }
      : statusTone === "healthy"
        ? {
            background: "linear-gradient(135deg, var(--green-soft), transparent)",
            borderColor: "var(--green)",
            chipClass: "chip chip-green",
          }
        : {
            background: "linear-gradient(135deg, var(--accent-soft), transparent)",
            borderColor: "var(--accent-glow)",
            chipClass: "chip chip-accent",
          };

  return (
    <div
      className="card"
      style={{
        marginBottom: 24,
        background: toneStyles.background,
        borderColor: toneStyles.borderColor,
      }}
    >
      <div className="row sp-between" style={{ gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="row" style={{ gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <span className={toneStyles.chipClass}>{statusLabel}</span>
            <span className="chip">{planLabel}</span>
            <span className="chip">{completedSteps}/{totalSteps} etapas</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 6 }}>
            {organizationName}
          </div>
          <div className="muted" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            {nextStep
              ? `Próxima alavanca: ${nextStep.label}. ${nextStep.description}`
              : "Conta configurada com os principais fundamentos para seguir operando."}
          </div>
        </div>
        <div style={{ width: 240, maxWidth: "100%" }}>
          <div className="row sp-between" style={{ marginBottom: 8 }}>
            <span className="muted" style={{ fontSize: 12.5 }}>Progresso do workspace</span>
            <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{progressPercent}%</span>
          </div>
          <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ width: `${progressPercent}%`, height: "100%", background: "var(--accent)" }} />
          </div>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <Link href="/config" className="btn btn-primary btn-sm" style={{ textDecoration: "none" }}>
              <Icon name="settings" size={13} />
              Ajustar conta
            </Link>
            <Link href="/faturamento" className="btn btn-ghost btn-sm" style={{ textDecoration: "none" }}>
              <Icon name="card" size={13} />
              Ver cobrança
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
