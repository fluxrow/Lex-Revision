import Icon from "@/components/ui/Icon";
import TemplateGrid from "@/components/ui/TemplateGrid";
import Link from "next/link";
import { getTemplates } from "@/lib/data";

export default async function FlowModelo() {
  const templates = await getTemplates();
  
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
      <TemplateGrid basePath="/novo/upload" templates={templates} />
    </>
  );
}
