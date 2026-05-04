-- ============================================================================
-- Lex Revision — Database Schema (Postgres / Supabase)
-- ============================================================================
-- Aplique com: supabase db push  (ou cole no SQL Editor do dashboard)
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─── Multi-tenant: organizations (escritórios de advocacia) ─────────────────
create table organizations (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text unique not null,
  cnpj            text,
  oab_section     text,                          -- ex: SP, RJ
  logo_url        text,
  plan            text not null default 'trial', -- trial | starter | professional | firm
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  subscription_status text not null default 'inactive',
  activated_at    timestamptz,
  trial_ends_at   timestamptz default (now() + interval '14 days'),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on organizations(stripe_customer_id);

-- ─── Membros (linka auth.users → organizations) ─────────────────────────────
create type member_role as enum ('owner', 'admin', 'lawyer', 'paralegal', 'viewer');

create table memberships (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            member_role not null default 'lawyer',
  full_name       text not null,
  oab_number      text,
  avatar_url      text,
  created_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index on memberships(user_id);
create index on memberships(organization_id);

-- ─── Clientes (do escritório) ───────────────────────────────────────────────
create type client_type as enum ('PF', 'PJ');

create table clients (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  type            client_type not null,
  name            text not null,
  document        text,                          -- CPF ou CNPJ
  email           text,
  phone           text,
  address         jsonb,                         -- {rua, numero, cidade, uf, cep}
  notes           text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on clients(organization_id);
create index on clients(name);

-- ─── Modelos de contrato ────────────────────────────────────────────────────
create table contract_templates (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,  -- null = template global
  name            text not null,
  category        text,                          -- Comercial, Imobiliário, Trabalhista, …
  description     text,
  storage_path    text not null,                 -- supabase storage: templates/{org}/{id}.docx
  variables       jsonb not null default '[]',   -- [{key, label, type, required, default}]
  uses_count      integer not null default 0,
  is_global       boolean not null default false,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on contract_templates(organization_id);
create index on contract_templates(category);

-- ─── Contratos ──────────────────────────────────────────────────────────────
create type contract_status as enum ('draft', 'pending_review', 'pending_signature', 'signed', 'cancelled');

create table contracts (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  template_id     uuid references contract_templates(id) on delete set null,
  client_id       uuid references clients(id) on delete set null,
  name            text not null,
  status          contract_status not null default 'draft',
  contract_type   text,                          -- ex: Consultoria, NDA, Locação
  value_cents     bigint default 0,
  currency        text default 'BRL',
  variable_values jsonb not null default '{}',   -- {NOME_CLIENTE: "Maria", ...}
  body_html       text,                          -- HTML renderizado para preview
  body_md         text,                          -- markdown editável
  ai_suggestions  jsonb default '[]',            -- [{clause, accepted, type}]
  pdf_storage_path text,                         -- arquivo final
  signed_at       timestamptz,
  expires_at      timestamptz,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on contracts(organization_id);
create index on contracts(client_id);
create index on contracts(status);
create index on contracts(created_at desc);

-- ─── Signatários (envio para assinatura digital) ────────────────────────────
create type signer_status as enum ('pending', 'viewed', 'signed', 'refused');

create table signature_requests (
  id              uuid primary key default uuid_generate_v4(),
  contract_id     uuid not null references contracts(id) on delete cascade,
  external_id     text,                          -- ID na Clicksign / D4Sign
  provider        text not null default 'clicksign',
  status          text not null default 'sent',  -- sent | partial | completed | cancelled
  sent_at         timestamptz default now(),
  completed_at    timestamptz,
  metadata        jsonb default '{}'
);
create index on signature_requests(contract_id);
create index on signature_requests(external_id);

create table signers (
  id              uuid primary key default uuid_generate_v4(),
  signature_request_id uuid not null references signature_requests(id) on delete cascade,
  name            text not null,
  email           text not null,
  document        text,
  status          signer_status not null default 'pending',
  signed_at       timestamptz,
  viewed_at       timestamptz,
  ip_address      inet,
  signature_url   text,                          -- link único enviado por e-mail
  position        integer not null default 0     -- ordem de assinatura
);
create index on signers(signature_request_id);

-- ─── Histórico / audit log ──────────────────────────────────────────────────
create table activity_logs (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid references auth.users(id),
  action          text not null,                 -- ex: contract.created, contract.signed
  resource_type   text not null,                 -- ex: contract, client, template
  resource_id     uuid,
  metadata        jsonb default '{}',
  created_at      timestamptz not null default now()
);
create index on activity_logs(organization_id, created_at desc);

-- ─── Faturamento (espelho dos webhooks Stripe) ──────────────────────────────
create table invoices (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  stripe_invoice_id text unique,
  amount_cents    bigint not null,
  currency        text not null default 'BRL',
  status          text not null,                 -- paid | open | void | uncollectible
  pdf_url         text,
  period_start    timestamptz,
  period_end      timestamptz,
  paid_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index on invoices(organization_id, created_at desc);

-- ─── Uso (para billing por consumo + UI de uso) ─────────────────────────────
create table usage_metrics (
  id              uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  metric          text not null,                 -- contracts_created | ai_calls | signatures
  value           integer not null default 1,
  period_month    date not null,                 -- ex: 2026-04-01
  created_at      timestamptz not null default now()
);
create index on usage_metrics(organization_id, period_month, metric);

-- ─── Triggers: updated_at automático ────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger t_organizations_updated before update on organizations
  for each row execute function set_updated_at();
create trigger t_clients_updated before update on clients
  for each row execute function set_updated_at();
create trigger t_templates_updated before update on contract_templates
  for each row execute function set_updated_at();
create trigger t_contracts_updated before update on contracts
  for each row execute function set_updated_at();

-- ─── Storage buckets ────────────────────────────────────────────────────────
-- Crie via dashboard (Storage):
--   templates/   (privado)
--   contracts/   (privado)
--   signed/      (privado)
--   logos/       (público — para logos de organização)
