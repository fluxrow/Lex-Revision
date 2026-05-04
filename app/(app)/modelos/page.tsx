import Icon from "@/components/ui/Icon";
import TemplateGrid from "@/components/ui/TemplateGrid";

export default function ModelosPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Modelos</h1>
          <div className="page-sub">Sua biblioteca de modelos (8)</div>
        </div>
        <div className="actions">
           <button className="btn btn-secondary"><Icon name="filter" size={15}/>Filtrar</button>
           <button className="btn btn-primary"><Icon name="plus" size={15}/>Novo modelo</button>
        </div>
      </div>
      <TemplateGrid basePath="/novo/upload" />
    </>
  );
}
