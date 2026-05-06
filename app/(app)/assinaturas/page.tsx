import Link from "next/link";

import Icon from "@/components/ui/Icon";
import { getSignatureOverview } from "@/lib/data.server";

function formatSignerEvent(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function AssinaturasPage() {
  const signatures = await getSignatureOverview();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Assinaturas</h1>
          <div className="page-sub">{signatures.length} processos em andamento</div>
        </div>
        <div className="actions">
          <Link href="/novo/upload" className="btn btn-primary" style={{ textDecoration: "none" }}>
            <Icon name="send" size={14} />
            Preparar envio
          </Link>
        </div>
      </div>
      {signatures.length === 0 ? (
        <div className="card">
          <div className="card-title">Nenhum fluxo de assinatura iniciado</div>
          <div className="card-sub">
            Assim que um contrato for enviado para assinatura digital, o acompanhamento real aparece aqui.
          </div>
          <div className="row" style={{ gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <Link href="/novo/upload" className="btn btn-primary" style={{ textDecoration: "none" }}>
              Subir contrato
            </Link>
            <Link href="/historico" className="btn btn-secondary" style={{ textDecoration: "none" }}>
              Ver histórico
            </Link>
          </div>
        </div>
      ) : (
        <div className="col" style={{ gap: 14 }}>
          {signatures.map((signature) => (
            <div key={signature.id} className="card" style={{ padding: 0 }}>
              <div className="row sp-between" style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{signature.contract}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                    {signature.progress} de {signature.total} assinaturas · {signature.provider}
                  </div>
                </div>
                <div className="row" style={{ gap: 12 }}>
                  <div style={{ width: 140, height: 6, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${signature.total > 0 ? (signature.progress / signature.total) * 100 : 0}%`,
                        height: "100%",
                        background: signature.progress === signature.total ? "var(--green)" : "var(--accent)",
                      }}
                    />
                  </div>
                  <span className={`chip ${signature.status === "completed" ? "chip-green" : "chip-accent"}`}>
                    {signature.status}
                  </span>
                </div>
              </div>
              <div style={{ padding: 8 }}>
                {signature.signers.map((signer, index) => (
                  <div
                    key={`${signature.id}-${signer.email}-${index}`}
                    className="row"
                    style={{ padding: "12px 16px", gap: 12, borderBottom: index < signature.signers.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <div className="avatar sm">{signer.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{signer.name}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{signer.email}</div>
                    </div>
                    {signer.status === "signed" ? (
                      <span className="chip chip-green"><Icon name="check" size={11} />Assinou {formatSignerEvent(signer.when) ? `· ${formatSignerEvent(signer.when)}` : ""}</span>
                    ) : null}
                    {signer.status === "viewed" ? (
                      <span className="chip chip-accent"><Icon name="eye" size={11} />Visualizou {formatSignerEvent(signer.when) ? `· ${formatSignerEvent(signer.when)}` : ""}</span>
                    ) : null}
                    {signer.status === "pending" ? (
                      <span className="chip chip-amber"><Icon name="clock" size={11} />Aguardando</span>
                    ) : null}
                    {signer.status === "refused" ? (
                      <span className="chip"><Icon name="x" size={11} />Recusou</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
