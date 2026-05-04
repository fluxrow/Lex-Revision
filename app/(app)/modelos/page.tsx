import Icon from "@/components/ui/Icon";
import TemplateGrid from "@/components/ui/TemplateGrid";
import { getTemplates } from "@/lib/data";

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
           <button className="btn btn-secondary"><Icon name="filter" size={15}/>Filtrar</button>
           <button className="btn btn-primary"><Icon name="plus" size={15}/>Novo modelo</button>
        </div>
      </div>
      <TemplateGrid basePath="/novo/upload" templates={templates} />
    </>
  );
}
