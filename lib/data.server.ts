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
      client: contract.clients?.name || "Cliente",
      value: (contract.value_cents || 0) / 100,
      status:
        contract.status === "draft"
          ? "rascunho"
          : contract.status === "signed"
            ? "assinado"
            : "aguardando",
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
