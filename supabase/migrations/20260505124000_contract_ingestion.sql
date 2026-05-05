alter table contracts
  add column if not exists source text default 'unknown',
  add column if not exists structured_payload jsonb not null default '{}'::jsonb;

create table if not exists contract_analysis_versions (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid not null references contracts(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  provider text not null,
  summary text,
  overall_risk text not null default 'medium',
  analysis_payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists contract_analysis_versions_contract_id_idx
  on contract_analysis_versions(contract_id, created_at desc);

create index if not exists contract_analysis_versions_org_id_idx
  on contract_analysis_versions(organization_id, created_at desc);

alter table contract_analysis_versions enable row level security;

create policy "members read contract analyses" on contract_analysis_versions
  for select using (
    exists(
      select 1 from public.memberships
      where user_id = auth.uid()
        and organization_id = contract_analysis_versions.organization_id
    )
  );

create policy "members write contract analyses" on contract_analysis_versions
  for all using (
    exists(
      select 1 from public.memberships
      where user_id = auth.uid()
        and organization_id = contract_analysis_versions.organization_id
    )
  )
  with check (
    exists(
      select 1 from public.memberships
      where user_id = auth.uid()
        and organization_id = contract_analysis_versions.organization_id
    )
  );
