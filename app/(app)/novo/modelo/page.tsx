import Icon from "@/components/ui/Icon";
import TemplateGrid from "@/components/ui/TemplateGrid";
import Link from "next/link";
import { getTemplatesCatalog } from "@/lib/data.server";

export default async function FlowModelo() {
  const catalog = await getTemplatesCatalog();
  const templates = catalog.items;
  
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Escolha um modelo</h1>
          <div className="page-sub">{templates.length} modelos prontos para usar</div>
        </div>
        <div className="actions">
          <Link href="/novo" className="btn btn-ghost" style={{textDecoration:'none'}}>
            <Icon name="arrow-left" size={14}/>Voltar
          </Link>
        </div>
      </div>
      {catalog.isFallback ? (
        <div className="card" style={{ marginBottom: 20, borderColor: "var(--amber)", background: "linear-gradient(135deg, var(--amber-soft), transparent)" }}>
          <div className="card-title">Modo demonstração</div>
          <div className="card-sub">Estes modelos são do preview interno. No modo real, o fluxo usa a biblioteca global e os modelos do seu escritório.</div>
        </div>
      ) : null}
      {!catalog.isFallback && catalog.isEmpty ? (
        <div className="card" style={{ borderColor: "var(--accent-glow)", background: "linear-gradient(135deg, var(--accent-soft), transparent)" }}>
          <div className="card-title">Nenhum modelo disponível ainda</div>
          <div className="card-sub">Suba um arquivo próprio enquanto a biblioteca global termina de ser carregada.</div>
          <div className="row" style={{ gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <Link href="/novo/upload" className="btn btn-primary" style={{ textDecoration: "none" }}><Icon name="upload" size={14}/>Subir modelo</Link>
          </div>
        </div>
      ) : (
        <TemplateGrid basePath="/novo/upload" templates={templates} />
      )}
    </>
  );
}
