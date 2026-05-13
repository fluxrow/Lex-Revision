import Icon from "@/components/ui/Icon";
import TemplateGrid from "@/components/ui/TemplateGrid";
import { getTemplatesCatalog } from "@/lib/data.server";
import Link from "next/link";

export default async function ModelosPage() {
  const catalog = await getTemplatesCatalog();
  const templates = catalog.items;
  
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Modelos</h1>
          <div className="page-sub">Sua biblioteca de modelos ({templates.length})</div>
        </div>
        <div className="actions">
           <span className={`chip ${catalog.isFallback ? "chip-amber" : "chip-green"}`}>
             {catalog.isFallback ? "Biblioteca demo" : "Biblioteca real"}
           </span>
           <Link href="/novo/upload" className="btn btn-primary" style={{ textDecoration: "none" }}><Icon name="plus" size={15}/>Subir modelo</Link>
        </div>
      </div>
      {catalog.isFallback ? (
        <div className="card" style={{ marginBottom: 20, borderColor: "var(--amber)", background: "linear-gradient(135deg, var(--amber-soft), transparent)" }}>
          <div className="card-title">Modelos de demonstração</div>
          <div className="card-sub">Você está vendo a biblioteca usada para preview interno. No ambiente real, os modelos globais e do seu escritório aparecem aqui.</div>
        </div>
      ) : null}
      {!catalog.isFallback && catalog.isEmpty ? (
        <div className="card" style={{ borderColor: "var(--accent-glow)", background: "linear-gradient(135deg, var(--accent-soft), transparent)" }}>
          <div className="card-title">Biblioteca pronta para receber seus modelos</div>
          <div className="card-sub">Os templates globais ainda não foram carregados ou sua organização ainda não publicou modelos próprios.</div>
          <div className="row" style={{ gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <Link href="/novo/upload" className="btn btn-primary" style={{ textDecoration: "none" }}><Icon name="upload" size={14}/>Subir primeiro modelo</Link>
          </div>
        </div>
      ) : (
        <TemplateGrid basePath="/novo/upload" templates={templates} />
      )}
    </>
  );
}
