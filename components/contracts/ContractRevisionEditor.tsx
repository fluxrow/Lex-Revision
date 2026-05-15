"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import Icon from "@/components/ui/Icon";

type ContractRevisionEditorProps = {
  contractId: string;
  initialName: string;
  initialContractType: string;
  initialBody: string;
  initialVariableValues: Record<string, string>;
  disabled?: boolean;
};

export default function ContractRevisionEditor({
  contractId,
  initialName,
  initialContractType,
  initialBody,
  initialVariableValues,
  disabled = false,
}: ContractRevisionEditorProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [contractType, setContractType] = useState(initialContractType);
  const [body, setBody] = useState(initialBody);
  const [changeSummary, setChangeSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          contractType,
          body,
          variableValues: initialVariableValues,
          changeSummary,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel salvar a nova versao.");
      }

      setMessage(`Versão ${payload.version?.number || "nova"} salva com sucesso.`);
      setChangeSummary("");
      startTransition(() => {
        router.refresh();
      });
    } catch (saveError: any) {
      setError(saveError.message || "Nao foi possivel salvar a nova versao.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">Revisar contrato</div>
      <div className="card-sub">
        Salve uma nova versão do texto e mantenha diff, análise e histórico operacional alinhados.
      </div>

      {disabled ? (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--amber-soft)",
            color: "var(--text)",
            marginTop: 14,
          }}
        >
          Este contrato está em fallback/demo. Crie um contrato real para ativar versionamento e revisão persistida.
        </div>
      ) : (
        <div className="col" style={{ gap: 12, marginTop: 14 }}>
          <div className="grid grid-2">
            <label className="col" style={{ gap: 6 }}>
              <span className="dim" style={{ fontSize: 12 }}>Nome do contrato</span>
              <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="col" style={{ gap: 6 }}>
              <span className="dim" style={{ fontSize: 12 }}>Tipo contratual</span>
              <input
                className="input"
                value={contractType}
                onChange={(event) => setContractType(event.target.value)}
              />
            </label>
          </div>

          <label className="col" style={{ gap: 6 }}>
            <span className="dim" style={{ fontSize: 12 }}>Resumo da mudança</span>
            <input
              className="input"
              value={changeSummary}
              onChange={(event) => setChangeSummary(event.target.value)}
              placeholder="Ex.: Ajustei rescisão, multa e cláusula de LGPD."
              maxLength={280}
            />
          </label>

          <label className="col" style={{ gap: 6 }}>
            <span className="dim" style={{ fontSize: 12 }}>Corpo do contrato</span>
            <textarea
              className="textarea"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={16}
              style={{
                width: "100%",
                resize: "vertical",
                minHeight: 360,
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--text)",
                padding: "14px 16px",
                font: "inherit",
                lineHeight: 1.65,
              }}
            />
          </label>

          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-primary" type="button" onClick={handleSave} disabled={saving}>
              <Icon name="check" size={14} />
              {saving ? "Salvando versão..." : "Salvar nova versão"}
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setName(initialName);
                setContractType(initialContractType);
                setBody(initialBody);
                setChangeSummary("");
                setError(null);
                setMessage(null);
              }}
              disabled={saving}
            >
              <Icon name="history" size={14} />
              Restaurar texto atual
            </button>
          </div>

          {message ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: "var(--green-soft)",
                border: "1px solid var(--border)",
                color: "var(--green)",
              }}
            >
              {message}
            </div>
          ) : null}

          {error ? (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                background: "var(--red-soft)",
                border: "1px solid var(--border)",
                color: "var(--red)",
              }}
            >
              {error}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
