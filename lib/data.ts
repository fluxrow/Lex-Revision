// Shared mock data for the Lex Revision app — mirrored from _prototype_app/data.jsx

export const MOCK_CONTRACTS = [
  { id: 'c-2481', name: 'Consultoria — Maria Silva', client: 'Maria Silva Andrade', value: 15000, status: 'assinado', updated: '2026-04-20', type: 'Consultoria jurídica' },
  { id: 'c-2480', name: 'Locação comercial — Rua Augusta', client: 'Construtora MX', value: 8500, status: 'aguardando', updated: '2026-04-20', type: 'Locação' },
  { id: 'c-2479', name: 'NDA — Projeto Atlas', client: 'TechNova SA', value: 0, status: 'em_analise', updated: '2026-04-19', type: 'NDA' },
  { id: 'c-2478', name: 'Rescisão — João Pereira', client: 'João Pereira', value: 3200, status: 'assinado', updated: '2026-04-18', type: 'Rescisão' },
  { id: 'c-2477', name: 'Prestação de serviços — Banco do Sul', client: 'Banco do Sul SA', value: 42000, status: 'rascunho', updated: '2026-04-17', type: 'Serviços' },
  { id: 'c-2476', name: 'Compra e venda — Apto 702', client: 'Ana Lopes', value: 620000, status: 'assinado', updated: '2026-04-16', type: 'Compra e venda' },
  { id: 'c-2475', name: 'Honorários — Caso Ribeiro', client: 'Ricardo Ribeiro', value: 18000, status: 'aguardando', updated: '2026-04-15', type: 'Honorários' },
  { id: 'c-2474', name: 'Confidencialidade — Startup Y', client: 'Startup Y Ltda', value: 0, status: 'assinado', updated: '2026-04-14', type: 'NDA' },
];

export const MOCK_CLIENTS = [
  { id: 'cl-1', name: 'Maria Silva Andrade', type: 'PF', doc: '123.456.789-00', email: 'maria@email.com', contracts: 4, since: '2024-06' },
  { id: 'cl-2', name: 'Construtora MX', type: 'PJ', doc: '12.345.678/0001-00', email: 'juridico@mx.com.br', contracts: 12, since: '2023-02' },
  { id: 'cl-3', name: 'TechNova SA', type: 'PJ', doc: '98.765.432/0001-22', email: 'contratos@technova.io', contracts: 8, since: '2024-11' },
  { id: 'cl-4', name: 'João Pereira', type: 'PF', doc: '987.654.321-00', email: 'joao.p@gmail.com', contracts: 2, since: '2025-01' },
  { id: 'cl-5', name: 'Banco do Sul SA', type: 'PJ', doc: '11.222.333/0001-44', email: 'contratos@bds.com.br', contracts: 23, since: '2022-08' },
  { id: 'cl-6', name: 'Ana Lopes', type: 'PF', doc: '222.333.444-55', email: 'ana.lopes@outlook.com', contracts: 1, since: '2026-03' },
];

export const MOCK_TEMPLATES = [
  { id: 't-1', name: 'Prestação de serviços', cat: 'Comercial', uses: 142, updated: '2026-04-10', vars: 8, accent: '#8FA3F5' },
  { id: 't-2', name: 'NDA — Confidencialidade', cat: 'Corporativo', uses: 98, updated: '2026-03-28', vars: 5, accent: '#7ce0a6' },
  { id: 't-3', name: 'Locação residencial', cat: 'Imobiliário', uses: 67, updated: '2026-04-15', vars: 12, accent: '#f5c46b' },
  { id: 't-4', name: 'Honorários advocatícios', cat: 'Jurídico', uses: 54, updated: '2026-04-02', vars: 7, accent: '#f08a8a' },
  { id: 't-5', name: 'Compra e venda de imóvel', cat: 'Imobiliário', uses: 41, updated: '2026-03-20', vars: 15, accent: '#A8B7F8' },
  { id: 't-6', name: 'Rescisão contratual', cat: 'Trabalhista', uses: 32, updated: '2026-04-18', vars: 9, accent: '#8FA3F5' },
  { id: 't-7', name: 'Procuração ad judicia', cat: 'Jurídico', uses: 28, updated: '2026-02-10', vars: 4, accent: '#7ce0a6' },
  { id: 't-8', name: 'Termo de acordo', cat: 'Jurídico', uses: 19, updated: '2026-03-05', vars: 6, accent: '#f5c46b' },
];

export const MOCK_SIGNATURES = [
  { id: 's-1', contract: 'Consultoria — Maria Silva', signers: [
    { name: 'Maria Silva Andrade', email: 'maria@email.com', status: 'signed', when: '20/04 14:32' },
    { name: 'Silva & Associados', email: 'marina@silvaadv.com', status: 'signed', when: '20/04 15:08' },
  ], progress: 2, total: 2 },
  { id: 's-2', contract: 'Locação — Rua Augusta', signers: [
    { name: 'Construtora MX', email: 'juridico@mx.com.br', status: 'signed', when: '20/04 10:15' },
    { name: 'Silva & Associados', email: 'marina@silvaadv.com', status: 'pending', when: null },
    { name: 'Testemunha 1', email: 't1@email.com', status: 'pending', when: null },
  ], progress: 1, total: 3 },
  { id: 's-3', contract: 'NDA — Projeto Atlas', signers: [
    { name: 'TechNova SA', email: 'contratos@technova.io', status: 'viewed', when: '19/04 09:20' },
    { name: 'Silva & Associados', email: 'marina@silvaadv.com', status: 'pending', when: null },
  ], progress: 0, total: 2 },
];

export const STATUS_LABELS: Record<string, { label: string; chip: string }> = {
  assinado: { label: 'Assinado', chip: 'chip-green' },
  aguardando: { label: 'Aguardando', chip: 'chip-amber' },
  em_analise: { label: 'Em análise', chip: 'chip-accent' },
  rascunho: { label: 'Rascunho', chip: '' },
};

export const fmtBRL = (v: number) => v === 0 ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y.slice(2)}`;
};

// Supabase fetching with mock fallback
import { createClient } from './supabase/client';

export async function getContracts() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('contracts').select('*, clients(name)').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return MOCK_CONTRACTS;
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      client: c.clients?.name || 'Cliente',
      value: (c.value_cents || 0) / 100,
      status: c.status === 'draft' ? 'rascunho' : c.status === 'signed' ? 'assinado' : 'aguardando',
      updated: c.updated_at.split('T')[0],
      type: c.contract_type || 'Geral'
    }));
  } catch {
    return MOCK_CONTRACTS;
  }
}

export async function getClients() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('clients').select('*, contracts(id)').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return MOCK_CLIENTS;
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type || 'PF',
      doc: c.document || '—',
      email: c.email || '—',
      contracts: c.contracts ? c.contracts.length : 0,
      since: c.created_at.substring(0, 7) // YYYY-MM
    }));
  } catch {
    return MOCK_CLIENTS;
  }
}

export async function getTemplates() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('contract_templates').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return MOCK_TEMPLATES;
    return data.map((t: any) => ({
      id: t.id,
      name: t.name,
      cat: t.category || 'Geral',
      uses: t.uses_count || 0,
      updated: t.updated_at.split('T')[0],
      vars: t.variables ? t.variables.length : 0,
      accent: '#8FA3F5'
    }));
  } catch {
    return MOCK_TEMPLATES;
  }
}
