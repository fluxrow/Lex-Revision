import { MOCK_CONTRACTS, MOCK_TEMPLATES } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export async function getContracts() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contracts")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_CONTRACTS;
    }

    return data.map((contract: any) => ({
      id: contract.id,
      name: contract.name,
      client: contract.clients?.name || "Rascunho interno",
      value: (contract.value_cents || 0) / 100,
      status:
        contract.status === "draft"
          ? "rascunho"
          : contract.status === "pending_review"
            ? "em_analise"
            : contract.status === "pending_signature"
              ? "aguardando"
          : contract.status === "signed"
            ? "assinado"
            : "rascunho",
      updated: contract.updated_at.split("T")[0],
      type: contract.contract_type || "Geral",
    }));
  } catch {
    return MOCK_CONTRACTS;
  }
}

export async function getTemplates() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contract_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return MOCK_TEMPLATES;
    }

    return data.map((template: any) => ({
      id: template.id,
      name: template.name,
      cat: template.category || "Geral",
      uses: template.uses_count || 0,
      updated: template.updated_at.split("T")[0],
      vars: template.variables ? template.variables.length : 0,
      accent: "#8FA3F5",
    }));
  } catch {
    return MOCK_TEMPLATES;
  }
}

export async function getTemplateById(templateId?: string | null) {
  if (!templateId) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("id", templateId)
      .maybeSingle();

    if (error || !data) {
      const fallback = MOCK_TEMPLATES.find((template) => template.id === templateId);
      return fallback
        ? {
            id: fallback.id,
            name: fallback.name,
            cat: fallback.cat,
            uses: fallback.uses,
            updated: fallback.updated,
            vars: fallback.vars,
            accent: fallback.accent,
            variableDefinitions: [],
          }
        : null;
    }

    return {
      id: data.id,
      name: data.name,
      cat: data.category || "Geral",
      uses: data.uses_count || 0,
      updated: data.updated_at.split("T")[0],
      vars: data.variables ? data.variables.length : 0,
      accent: "#8FA3F5",
      variableDefinitions: Array.isArray(data.variables) ? data.variables : [],
    };
  } catch {
    const fallback = MOCK_TEMPLATES.find((template) => template.id === templateId);
    return fallback
      ? {
          id: fallback.id,
          name: fallback.name,
          cat: fallback.cat,
          uses: fallback.uses,
          updated: fallback.updated,
          vars: fallback.vars,
          accent: fallback.accent,
          variableDefinitions: [],
        }
      : null;
  }
}
