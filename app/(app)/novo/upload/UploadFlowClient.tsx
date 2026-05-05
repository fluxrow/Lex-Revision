"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Icon from "@/components/ui/Icon";

type TemplateSummary = {
  id: string;
  name: string;
  cat: string;
  uses: number;
  updated: string;
  vars: number;
  accent: string;
  variableDefinitions?: Array<{ key?: string; label?: string }>;
} | null;

type UploadFlowClientProps = {
  selectedTemplate: TemplateSummary;
};

type VariableState = Record<string, string>;

const DEFAULT_VARIABLES = [
  { key: "nome", label: "Nome do cliente", placeholder: "Maria Silva Andrade" },
  { key: "cpf", label: "CPF / CNPJ", placeholder: "123.456.789-00" },
  { key: "valor", label: "Valor (R$)", placeholder: "15.000,00" },
  { key: "prazo", label: "Prazo (dias)", placeholder: "90" },
  { key: "data", label: "Data início", placeholder: "01/05/2026" },
  { key: "objeto", label: "Objeto do contrato", placeholder: "Consultoria jurídica" },
] as const;

export default function UploadFlowClient({ selectedTemplate }: UploadFlowClientProps) {
  const router = useRouter();
  const [stage, setStage] = React.useState(0);
  const [addedClause, setAddedClause] = React.useState(false);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const variableFields = React.useMemo(() => {
    const templateFields =
      selectedTemplate?.variableDefinitions?.length
        ? selectedTemplate.variableDefinitions.map((item, index) => ({
            key: slugify(item.key || item.label || `campo_${index + 1}`),
            label: item.label || item.key || `Campo ${index + 1}`,
            placeholder: item.label || item.key || `Campo ${index + 1}`,
          }))
        : [];

    return templateFields.length > 0 ? templateFields : [...DEFAULT_VARIABLES];
  }, [selectedTemplate]);

  const [values, setValues] = React.useState<VariableState>(() =>
    variableFields.reduce<VariableState>((acc, field) => {
      acc[field.key] = field.placeholder;
      return acc;
    }, {})
  );

  React.useEffect(() => {
    setValues(
      variableFields.reduce<VariableState>((acc, field) => {
        acc[field.key] = field.placeholder;
        return acc;
      }, {})
    );
  }, [variableFields]);

  const contractTitle = selectedTemplate?.name || "Contrato de Prestação de Serviços";
  const contractType = selectedTemplate?.cat || "Serviços";
  const persistableTemplateId =
    selectedTemplate?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedTemplate.id)
      ? selectedTemplate.id
      : null;

  const uploadSummary = selectedTemplate
    ? `${selectedTemplate.name} · ${selectedTemplate.vars} variáveis prontas`
    : "contrato_servicos.docx · 6 variáveis detectadas";

  const handleSaveDraft = async () => {
    setSaveLoading(true);
    setError(null);

    try {
      const body = buildContractBody(contractTitle, values, addedClause);
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: contractTitle,
          contractType,
          templateId: persistableTemplateId,
          variableValues: values,
          body,
          source: selectedTemplate ? "template_fill" : "upload_flow",
          appliedSuggestions: addedClause
            ? [
                {
                  id: "confidentiality",
                  title: "Cláusula de confidencialidade",
                  priority: "medium",
                  motivo: "Protege informações compartilhadas no fluxo contratual.",
                  text: "As partes obrigam-se a manter sigilo sobre informações trocadas no contexto deste contrato.",
                },
              ]
            : [],
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel salvar o rascunho.");
      }

      router.push("/historico");
      router.refresh();
    } catch (saveError: any) {
      setError(saveError.message || "Nao foi possivel salvar o rascunho.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{selectedTemplate ? "Usar modelo da biblioteca" : "Subir modelo"}</h1>
          <div className="page-sub">
            {selectedTemplate
              ? `Preencha ${selectedTemplate.name} e salve o rascunho no workspace`
              : "Envie um .docx e detectamos as variáveis"}
          </div>
        </div>
        <div className="actions">
          <Link href={selectedTemplate ? "/novo/modelo" : "/novo"} className="btn btn-ghost" style={{ textDecoration: "none" }}>
            <Icon name="arrow-left" size={14} />
            Voltar
          </Link>
        </div>
      </div>

      <StepsHeader steps={["Enviar", "Preencher", "Revisar"]} current={stage} />

      {stage === 0 ? (
        <UploadStage
          selectedTemplate={selectedTemplate}
          uploadSummary={uploadSummary}
          variableFields={variableFields}
          onNext={() => setStage(1)}
        />
      ) : null}

      {stage === 1 ? (
        <FillStage
          values={values}
          fields={variableFields}
          contractTitle={contractTitle}
          onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
          onNext={() => setStage(2)}
          onBack={() => setStage(0)}
        />
      ) : null}

      {stage === 2 ? (
        <ReviewStage
          title={contractTitle}
          values={values}
          addedClause={addedClause}
          saving={saveLoading}
          error={error}
          onToggleClause={() => setAddedClause((current) => !current)}
          onSave={handleSaveDraft}
          onBack={() => setStage(1)}
        />
      ) : null}
    </>
  );
}

function StepsHeader({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="row" style={{ gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="row" style={{ gap: 8, color: index === current ? "var(--text)" : index < current ? "var(--accent)" : "var(--text-dim)" }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: index === current ? "var(--accent)" : index < current ? "var(--accent-soft)" : "var(--surface-2)",
                color: index === current ? "var(--bg-deep)" : index < current ? "var(--accent)" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                border: index === current ? "none" : "1px solid var(--border)",
              }}
            >
              {index < current ? <Icon name="check" size={12} /> : index + 1}
            </div>
            <span style={{ fontSize: 13, fontWeight: index === current ? 600 : 500 }}>{step}</span>
          </div>
          {index < steps.length - 1 ? <div style={{ flex: 1, maxWidth: 40, height: 1, background: "var(--border)" }} /> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function UploadStage({
  selectedTemplate,
  uploadSummary,
  variableFields,
  onNext,
}: {
  selectedTemplate: TemplateSummary;
  uploadSummary: string;
  variableFields: Array<{ key: string; label: string; placeholder: string }>;
  onNext: () => void;
}) {
  const hasTemplate = Boolean(selectedTemplate);
  const [ready, setReady] = React.useState(hasTemplate);

  return (
    <div className="card" style={{ padding: 32 }}>
      <div
        style={{
          height: 320,
          borderRadius: 18,
          border: `2px dashed ${ready ? "var(--accent)" : "var(--border-hi)"}`,
          background: ready ? "var(--accent-soft)" : "var(--surface-2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          cursor: "pointer",
        }}
        onClick={() => setReady(true)}
      >
        {!ready ? (
          <>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="upload" size={28} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Arraste seu modelo aqui</div>
            <div className="muted" style={{ fontSize: 13 }}>.docx, .doc, .pdf — até 25 MB</div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 6 }}>
              Ou escolher arquivo
            </button>
          </>
        ) : (
          <>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--bg-deep)" }}>
              <Icon name="check" size={28} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedTemplate?.name || "contrato_servicos.docx"}</div>
            <div style={{ color: "var(--green)", fontSize: 13 }}>
              {hasTemplate ? uploadSummary : "Enviado · 24 KB · 6 variáveis detectadas"}
            </div>
          </>
        )}
      </div>

      {ready ? (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10 }}>
            Variáveis detectadas
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {variableFields.map((field) => (
              <div key={field.key} className="row" style={{ padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8, gap: 8 }}>
                <span className="mono" style={{ color: "var(--accent)", fontSize: 13 }}>{`{{${field.key.toUpperCase()}}}`}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="row sp-between" style={{ marginTop: 28 }}>
        <span className="muted" style={{ fontSize: 12 }}>{ready ? "Tudo pronto para preencher" : "Aguardando arquivo"}</span>
        <button className="btn btn-primary" disabled={!ready} onClick={onNext} style={{ opacity: ready ? 1 : 0.5 }}>
          Continuar <Icon name="arrow-right" size={14} />
        </button>
      </div>
    </div>
  );
}

function FillStage({
  values,
  fields,
  contractTitle,
  onChange,
  onNext,
  onBack,
}: {
  values: VariableState;
  fields: Array<{ key: string; label: string; placeholder: string }>;
  contractTitle: string;
  onChange: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>
      <div className="card">
        <div className="card-title">Preencha as variáveis</div>
        <div className="card-sub">O contrato se atualiza ao vivo ao lado</div>
        {fields.map((field) => (
          <div className="field" key={field.key}>
            <label className="field-label">{field.label}</label>
            <input className="input" value={values[field.key] || ""} onChange={(event) => onChange(field.key, event.target.value)} />
          </div>
        ))}
        <div className="row sp-between" style={{ marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onBack}>
            <Icon name="arrow-left" size={14} />
            Voltar
          </button>
          <button className="btn btn-primary" onClick={onNext}>
            Continuar <Icon name="arrow-right" size={14} />
          </button>
        </div>
      </div>
      <DocPreview title={contractTitle} values={values} />
    </div>
  );
}

function DocPreview({ title, values }: { title: string; values: VariableState }) {
  const entries = Object.entries(values);
  const introValues = entries.slice(0, 2);
  const businessValues = entries.slice(2, 5);

  const highlight = (value: string) => (
    <span style={{ background: "var(--green-soft)", color: "var(--green)", padding: "0 4px", borderRadius: 3, fontWeight: 600 }}>
      {value}
    </span>
  );

  return (
    <div
      style={{
        position: "sticky",
        top: 20,
        background: "#fafaf6",
        color: "#1a1a1a",
        padding: "28px 32px",
        borderRadius: 14,
        fontFamily: "Georgia, serif",
        fontSize: 13,
        lineHeight: 1.55,
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div className="row sp-between" style={{ marginBottom: 18 }}>
        <span className="chip chip-green" style={{ fontFamily: "var(--font-inter)" }}>
          <span className="chip-dot" />
          Pré-visualização ao vivo
        </span>
        <span style={{ fontFamily: "var(--font-inter)", fontSize: 11, color: "#666" }}>Página 1 de 3</span>
      </div>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
        {title}
      </div>
      <p>
        Pelo presente instrumento, de um lado {highlight(introValues[0]?.[1] || "Contratante")} e de outro lado{" "}
        {highlight(introValues[1]?.[1] || "Contratada")}, têm entre si justo e contratado o seguinte.
      </p>
      <p style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Cláusula 1ª — Do Objeto</p>
      <p>{businessValues[2]?.[1] ? `O objeto deste contrato corresponde a ${businessValues[2][1]}.` : "O objeto deste contrato será definido conforme o escopo ajustado entre as partes."}</p>
      <p style={{ fontWeight: 700, marginTop: 12, marginBottom: 4 }}>Cláusula 2ª — Valor e Prazo</p>
      <p>
        Valor total de {highlight(businessValues[0]?.[1] || "R$ 0,00")}, prazo de {highlight(businessValues[1]?.[1] || "30")} dias.
      </p>
    </div>
  );
}

function ReviewStage({
  title,
  values,
  addedClause,
  saving,
  error,
  onToggleClause,
  onSave,
  onBack,
}: {
  title: string;
  values: VariableState;
  addedClause: boolean;
  saving: boolean;
  error: string | null;
  onToggleClause: () => void;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr", gap: 20, alignItems: "start" }}>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
          <div className="card-title">Pré-visualização final</div>
        </div>
        <div style={{ background: "#fafaf6", color: "#1a1a1a", padding: 30, fontFamily: "Georgia, serif", fontSize: 13, lineHeight: 1.55, minHeight: 400 }}>
          <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
            {title}
          </div>
          <p>Pelo presente instrumento, de um lado <strong>{values[Object.keys(values)[0]]}</strong> e de outro lado <strong>{values[Object.keys(values)[1]]}</strong>…</p>
          <p style={{ fontWeight: 700, marginTop: 10 }}>Cláusula 1ª — Do Objeto</p>
          <p>{values[Object.keys(values)[Math.min(5, Object.keys(values).length - 1)]] || "Objeto contratual."}</p>
          <p style={{ fontWeight: 700, marginTop: 10 }}>Cláusula 2ª — Valor e Prazo</p>
          <p>{values[Object.keys(values)[2]] || "R$ 0,00"} em {values[Object.keys(values)[3]] || "30"} dias.</p>
          {addedClause ? (
            <div style={{ marginTop: 10, padding: 10, background: "rgba(91,111,209,0.1)", border: "1px solid rgba(91,111,209,0.3)", borderRadius: 6 }}>
              <p style={{ fontWeight: 700, margin: "0 0 4px" }}>
                Cláusula 3ª — Da Confidencialidade{" "}
                <span style={{ fontFamily: "var(--font-inter)", fontSize: 10, fontWeight: 700, background: "rgba(91,111,209,0.25)", color: "#5b6fd1", padding: "1px 6px", borderRadius: 3, marginLeft: 6 }}>
                  IA
                </span>
              </p>
              <p style={{ margin: 0 }}>As partes obrigam-se a manter sigilo sobre informações trocadas no contexto deste contrato.</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="col" style={{ gap: 16 }}>
        {error ? (
          <div style={{ color: "var(--destructive, #ef4444)", fontSize: 13, padding: "10px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 8 }}>
            {error}
          </div>
        ) : null}

        <div className="card" style={{ background: "linear-gradient(135deg, var(--accent-soft), transparent)", borderColor: "var(--accent-glow)" }}>
          <div className="row" style={{ gap: 8, marginBottom: 10 }}>
            <Icon name="sparkle" size={16} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>IA sugere</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Cláusula de confidencialidade</div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Recomendamos incluir proteção de informações.</div>
          <div className="row" style={{ gap: 8 }}>
            <button className={`btn ${addedClause ? "btn-secondary" : "btn-primary"} btn-sm`} onClick={onToggleClause}>
              <Icon name={addedClause ? "check" : "plus"} size={13} />
              {addedClause ? "Adicionada" : "Adicionar"}
            </button>
            <button className="btn btn-ghost btn-sm">Ver outras</button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Finalizar</div>
          <div className="card-sub">Feche o fluxo operacional deste rascunho</div>
          <button className="btn btn-primary btn-lg" style={{ width: "100%", marginBottom: 8 }} onClick={onSave} disabled={saving}>
            <Icon name="file" size={16} />
            {saving ? "Salvando..." : "Salvar no histórico"}
          </button>
          <button className="btn btn-secondary" style={{ width: "100%", marginBottom: 8 }}>
            <Icon name="download" size={15} />
            Exportar PDF
          </button>
          <button className="btn btn-ghost" style={{ width: "100%" }}>
            <Icon name="pen" size={15} />
            Enviar para assinatura
          </button>
        </div>

        <div className="row sp-between">
          <button className="btn btn-ghost" onClick={onBack}>
            <Icon name="arrow-left" size={14} />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

function buildContractBody(title: string, values: VariableState, addedClause: boolean) {
  const lines = [
    title,
    "",
    `Partes: ${Object.values(values).slice(0, 2).join(" / ")}`,
    "",
    "Clausula 1 - Objeto",
    Object.values(values)[Math.min(5, Object.keys(values).length - 1)] || "Objeto contratual.",
    "",
    "Clausula 2 - Valor e Prazo",
    `${Object.values(values)[2] || "R$ 0,00"} em ${Object.values(values)[3] || "30"} dias.`,
  ];

  if (addedClause) {
    lines.push(
      "",
      "Clausula 3 - Confidencialidade",
      "As partes obrigam-se a manter sigilo sobre informacoes trocadas no contexto deste contrato."
    );
  }

  return lines.join("\n");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
