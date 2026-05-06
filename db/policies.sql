-- ============================================================================
-- Lex Revision — Row Level Security (RLS) Policies
-- ============================================================================
-- Garante que cada escritório só vê os próprios dados.
-- Aplique APÓS schema.sql.
-- ============================================================================

-- Helper: organização atual do usuário logado
create or replace function public.user_organizations()
returns setof uuid
language sql security definer stable as $$
  select organization_id from public.memberships where user_id = auth.uid();
$$;

create or replace function public.is_member_of(org_id uuid)
returns boolean
language sql security definer stable as $$
  select exists(
    select 1 from public.memberships
    where user_id = auth.uid() and organization_id = org_id
  );
$$;

create or replace function public.has_role_in(org_id uuid, roles text[])
returns boolean
language sql security definer stable as $$
  select exists(
    select 1 from public.memberships
    where user_id = auth.uid()
      and organization_id = org_id
      and role::text = any(roles)
  );
$$;

-- ─── Enable RLS em todas as tabelas ─────────────────────────────────────────
alter table organizations         enable row level security;
alter table memberships           enable row level security;
alter table clients               enable row level security;
alter table contract_templates    enable row level security;
alter table contracts             enable row level security;
alter table signature_requests    enable row level security;
alter table signers               enable row level security;
alter table activity_logs         enable row level security;
alter table invoices              enable row level security;
alter table usage_metrics         enable row level security;

-- ─── organizations ──────────────────────────────────────────────────────────
create policy "members can read their org" on organizations
  for select using (public.is_member_of(id));

create policy "owners/admins can update org" on organizations
  for update using (public.has_role_in(id, array['owner','admin']));

-- ─── memberships ────────────────────────────────────────────────────────────
create policy "members can read same-org memberships" on memberships
  for select using (public.is_member_of(organization_id));

create policy "owners/admins manage memberships" on memberships
  for all using (public.has_role_in(organization_id, array['owner','admin']));

create policy "users can read own membership" on memberships
  for select using (user_id = auth.uid());

-- ─── clients ────────────────────────────────────────────────────────────────
create policy "members read clients" on clients
  for select using (public.is_member_of(organization_id));

create policy "members write clients" on clients
  for all using (public.is_member_of(organization_id))
  with check (public.is_member_of(organization_id));

-- ─── contract_templates ────────────────────────────────────────────────────
create policy "everyone reads global templates" on contract_templates
  for select using (is_global = true);

create policy "members read org templates" on contract_templates
  for select using (organization_id is not null and public.is_member_of(organization_id));

create policy "members write org templates" on contract_templates
  for all using (organization_id is not null and public.is_member_of(organization_id))
  with check (organization_id is not null and public.is_member_of(organization_id));

-- ─── contracts ──────────────────────────────────────────────────────────────
create policy "members read contracts" on contracts
  for select using (public.is_member_of(organization_id));

create policy "members write contracts" on contracts
  for all using (public.is_member_of(organization_id))
  with check (public.is_member_of(organization_id));

-- ─── signature_requests + signers ──────────────────────────────────────────
create policy "members read sig requests" on signature_requests
  for select using (
    exists(select 1 from contracts c where c.id = contract_id and public.is_member_of(c.organization_id))
  );
create policy "members write sig requests" on signature_requests
  for all using (
    exists(select 1 from contracts c where c.id = contract_id and public.is_member_of(c.organization_id))
  );

create policy "members read signers" on signers
  for select using (
    exists(
      select 1 from signature_requests sr
      join contracts c on c.id = sr.contract_id
      where sr.id = signature_request_id and public.is_member_of(c.organization_id)
    )
  );
create policy "members write signers" on signers
  for all using (
    exists(
      select 1 from signature_requests sr
      join contracts c on c.id = sr.contract_id
      where sr.id = signature_request_id and public.is_member_of(c.organization_id)
    )
  );

-- ─── activity_logs (read-only para members) ────────────────────────────────
create policy "members read logs" on activity_logs
  for select using (public.is_member_of(organization_id));

-- ─── invoices (read-only) ──────────────────────────────────────────────────
create policy "owners/admins read invoices" on invoices
  for select using (public.has_role_in(organization_id, array['owner','admin']));

-- ─── usage_metrics (read-only) ─────────────────────────────────────────────
create policy "members read usage" on usage_metrics
  for select using (public.is_member_of(organization_id));

-- ─── service_role (Edge Functions / webhooks) bypassa RLS automaticamente ──
-- Qualquer mutação vinda de webhooks Stripe/Clicksign deve usar service_role.
