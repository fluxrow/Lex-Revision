import { MOCK_CONTRACTS, MOCK_TEMPLATES } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export type ClientSummary = {
  id: string;
  name: string;
  type: string;
  doc: string;
  email: string;
  contracts: number;
  since: string;
};

export type SignatureSummary = {
  id: string;
  contract: string;
  provider: string;
  status: string;
  progress: number;
  total: number;
  signers: Array<{
    name: string;
    email: string;
    status: string;
    when: string | null;
  }>;
};

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

export async function getClientsOverview(): Promise<ClientSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("id, type, name, document, email, created_at, contracts(id)")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((client: any) => ({
      id: client.id,
      name: client.name,
      type: client.type || "PF",
      doc: client.document || "—",
      email: client.email || "—",
      contracts: Array.isArray(client.contracts) ? client.contracts.length : 0,
      since: client.created_at ? client.created_at.substring(0, 7) : "—",
    }));
  } catch {
    return [];
  }
}

export async function getSignatureOverview(): Promise<SignatureSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("signature_requests")
      .select(
        "id, provider, status, sent_at, completed_at, contract:contracts(name), signers(name, email, status, signed_at, viewed_at, position)"
      )
      .order("sent_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((request: any) => {
      const signers = Array.isArray(request.signers)
        ? [...request.signers].sort((a, b) => (a.position || 0) - (b.position || 0))
        : [];
      const progress = signers.filter((signer) => signer.status === "signed").length;

      return {
        id: request.id,
        contract: request.contract?.name || "Contrato sem nome",
        provider: request.provider || "clicksign",
        status: request.status || "sent",
        progress,
        total: signers.length,
        signers: signers.map((signer) => ({
          name: signer.name,
          email: signer.email,
          status: signer.status,
          when: signer.signed_at || signer.viewed_at || null,
        })),
      };
    });
  } catch {
    return [];
  }
}
