import Icon from "@/components/ui/Icon";
import type { OnboardingStep } from "@/lib/account/overview";

export default function OnboardingChecklist({
  steps,
  title = "Próximos passos",
  subtitle = "O que ainda vale fechar para deixar a operação mais redonda.",
}: {
  steps: OnboardingStep[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-sub">{subtitle}</div>
      <div className="col" style={{ gap: 10, marginTop: 14 }}>
        {steps.map((step) => (
          <div
            key={step.id}
            className="row"
            style={{
              gap: 12,
              alignItems: "flex-start",
              padding: "12px 14px",
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: step.complete ? "var(--surface-2)" : "transparent",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: step.complete ? "var(--green-soft)" : "var(--accent-soft)",
                color: step.complete ? "var(--green)" : "var(--accent)",
                flexShrink: 0,
              }}
            >
              <Icon name={step.complete ? "check" : "clock"} size={14} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{step.label}</div>
              <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.55, marginTop: 3 }}>
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
