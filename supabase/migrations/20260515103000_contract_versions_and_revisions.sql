create table if not exists contract_versions (
  id uuid primary key default uuid_generate_v4(),
  contract_id uuid not null references contracts(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  version_number integer not null,
  name text not null,
  contract_type text,
  body_md text not null,
  structured_payload jsonb not null default '{}'::jsonb,
  change_summary text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (contract_id, version_number)
);

create index if not exists contract_versions_contract_id_idx
  on contract_versions(contract_id, created_at desc);

create index if not exists contract_versions_org_id_idx
  on contract_versions(organization_id, created_at desc);

alter table contract_versions enable row level security;

create policy "members read contract versions" on contract_versions
  for select using (
    exists(
      select 1 from public.memberships
      where user_id = auth.uid()
        and organization_id = contract_versions.organization_id
    )
  );

create policy "members write contract versions" on contract_versions
  for all using (
    exists(
      select 1 from public.memberships
      where user_id = auth.uid()
        and organization_id = contract_versions.organization_id
    )
  )
  with check (
    exists(
      select 1 from public.memberships
      where user_id = auth.uid()
        and organization_id = contract_versions.organization_id
    )
  );

insert into contract_versions (
  contract_id,
  organization_id,
  version_number,
  name,
  contract_type,
  body_md,
  structured_payload,
  change_summary,
  created_by,
  created_at
)
select
  contracts.id,
  contracts.organization_id,
  1,
  contracts.name,
  contracts.contract_type,
  coalesce(contracts.body_md, contracts.body_html, ''),
  coalesce(contracts.structured_payload, '{}'::jsonb),
  'Versão inicial importada do contrato atual.',
  contracts.created_by,
  contracts.created_at
from contracts
where not exists (
  select 1
  from contract_versions existing
  where existing.contract_id = contracts.id
);
