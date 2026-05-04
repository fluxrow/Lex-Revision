alter table organizations
  add column if not exists stripe_price_id text,
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists activated_at timestamptz;
