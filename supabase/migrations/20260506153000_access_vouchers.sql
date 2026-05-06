create table if not exists access_vouchers (
  id uuid primary key default uuid_generate_v4(),
  issuer_organization_id uuid not null references organizations(id) on delete cascade,
  recipient_email text not null,
  recipient_name text,
  company_name text,
  plan text not null default 'professional',
  role member_role not null default 'owner',
  code text not null unique,
  status text not null default 'issued',
  notes text,
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by_user_id uuid references auth.users(id) on delete set null,
  redeemed_organization_id uuid references organizations(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint access_vouchers_status_check check (status in ('issued', 'redeemed', 'revoked', 'expired')),
  constraint access_vouchers_plan_check check (plan in ('starter', 'professional', 'firm'))
);

create index if not exists access_vouchers_issuer_org_idx
  on access_vouchers(issuer_organization_id, created_at desc);

create index if not exists access_vouchers_recipient_email_idx
  on access_vouchers(recipient_email);

create index if not exists access_vouchers_status_idx
  on access_vouchers(status, created_at desc);

create trigger t_access_vouchers_updated before update on access_vouchers
  for each row execute function set_updated_at();

alter table access_vouchers enable row level security;

create policy "owners/admins read vouchers" on access_vouchers
  for select using (public.has_role_in(issuer_organization_id, array['owner', 'admin']));

create policy "owners/admins manage vouchers" on access_vouchers
  for all using (public.has_role_in(issuer_organization_id, array['owner', 'admin']))
  with check (public.has_role_in(issuer_organization_id, array['owner', 'admin']));
