import Icon from "@/components/ui/Icon";
import TemplateGrid from "@/components/ui/TemplateGrid";
import { getTemplates } from "@/lib/data.server";
import Link from "next/link";

export default async function ModelosPage() {
  const templates = await getTemplates();
  
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Modelos</h1>
          <div className="page-sub">Sua biblioteca de modelos ({templates.length})</div>
        </div>
        <div className="actions">
           <span className="chip">Biblioteca operacional</span>
           <Link href="/novo/upload" className="btn btn-primary" style={{ textDecoration: "none" }}><Icon name="plus" size={15}/>Subir modelo</Link>
        </div>
      </div>
      <TemplateGrid basePath="/novo/upload" templates={templates} />
    </>
  );
}
