"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import Icon from "@/components/ui/Icon";
import type { ClientSummary } from "@/lib/data.server";

export default function ClientsPageClient({
  initialClients,
}: {
  initialClients: ClientSummary[];
}) {
  const [clients, setClients] = useState(initialClients);
  const [selectedId, setSelectedId] = useState(initialClients[0]?.id ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"PF" | "PJ">("PF");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedId) ?? clients[0] ?? null,
    [clients, selectedId]
  );

  const createClient = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          type,
          document,
          email,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel cadastrar o cliente.");
      }

      setClients((current) => [payload.client, ...current]);
      setSelectedId(payload.client.id);
      setShowCreate(false);
      setName("");
      setType("PF");
      setDocument("");
      setEmail("");
      setMessage("Cliente criado com sucesso.");
    } catch (err: any) {
      setError(err.message || "Nao foi possivel cadastrar o cliente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clientes</h1>
          <div className="page-sub">{clients.length} clientes ativos</div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" type="button" onClick={() => setShowCreate((value) => !value)}>
            <Icon name="plus" size={14} />
            Novo cliente
          </button>
        </div>
      </div>

      {showCreate ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Cadastrar cliente</div>
          <div className="card-sub">Crie o registro real do cliente antes de iniciar novos contratos.</div>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Nome</label>
              <input className="input" value={name} onChange={(event) => setName(event.target.value)} disabled={saving} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Tipo</label>
              <select className="input" value={type} onChange={(event) => setType(event.target.value as "PF" | "PJ")} disabled={saving}>
                <option value="PF">PF</option>
                <option value="PJ">PJ</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">CPF ou CNPJ</label>
              <input className="input" value={document} onChange={(event) => setDocument(event.target.value)} disabled={saving} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">E-mail</label>
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={saving} />
            </div>
          </div>
          {error ? (
            <div style={{ color: "var(--destructive, #ef4444)", fontSize: 13, marginTop: 14, padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: 6 }}>
              {error}
            </div>
          ) : null}
          <div className="row" style={{ gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button className="btn btn-primary" type="button" onClick={createClient} disabled={saving}>
              {saving ? "Salvando..." : "Salvar cliente"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => setShowCreate(false)} disabled={saving}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <div style={{ color: "var(--green)", fontSize: 13, marginBottom: 16, padding: "8px 12px", background: "var(--green-soft)", borderRadius: 6 }}>
          {message}
        </div>
      ) : null}

      <div className="grid" style={{ gridTemplateColumns: "1.3fr 1fr", gap: 20, alignItems: "start" }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Cliente</th><th>Tipo</th><th>Contratos</th></tr>
            </thead>
            <tbody>
              {clients.length > 0 ? clients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => setSelectedId(client.id)}
                  style={{ background: selectedClient?.id === client.id ? "var(--surface-2)" : undefined, cursor: "pointer" }}
                >
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <div className="avatar sm" style={{ background: client.type === "PJ" ? "var(--amber)" : undefined }}>
                        {client.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{client.name}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`chip ${client.type === "PJ" ? "chip-amber" : "chip-accent"}`}>{client.type}</span></td>
                  <td className="mono">{client.contracts}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="muted" style={{ padding: "18px 20px" }}>
                    Nenhum cliente cadastrado ainda. Crie o primeiro para começar os fluxos reais de contrato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ position: "sticky", top: 20 }}>
          {selectedClient ? (
            <>
              <div className="row" style={{ gap: 14, marginBottom: 18 }}>
                <div className="avatar xl">{selectedClient.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{selectedClient.name}</div>
                  <div className="muted mono" style={{ fontSize: 12, marginTop: 2 }}>{selectedClient.doc}</div>
                  <div className="row" style={{ gap: 6, marginTop: 8 }}>
                    <span className={`chip ${selectedClient.type === "PJ" ? "chip-amber" : "chip-accent"}`}>{selectedClient.type}</span>
                    <span className="chip">Cliente desde {selectedClient.since}</span>
                  </div>
                </div>
              </div>
              <div className="divider" />
              <div className="col" style={{ gap: 10 }}>
                <div className="row sp-between">
                  <span className="muted" style={{ fontSize: 12 }}>E-mail</span>
                  <span style={{ fontSize: 13 }}>{selectedClient.email}</span>
                </div>
                <div className="row sp-between">
                  <span className="muted" style={{ fontSize: 12 }}>Contratos</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedClient.contracts}</span>
                </div>
              </div>
              <div className="divider" />
              <Link href="/novo" className="btn btn-primary" style={{ width: "100%", textDecoration: "none", display: "inline-flex", justifyContent: "center" }}>
                <Icon name="plus" size={14} />
                Novo contrato para {selectedClient.name.split(" ")[0]}
              </Link>
            </>
          ) : (
            <div className="muted" style={{ fontSize: 13 }}>
              Selecione ou crie um cliente para ver os detalhes.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
