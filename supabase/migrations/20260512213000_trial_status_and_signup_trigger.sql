alter table public.organizations
  alter column subscription_status set default 'trial';

update public.organizations
set
  subscription_status = 'trial',
  trial_ends_at = coalesce(trial_ends_at, now() + interval '14 days')
where subscription_status = 'inactive'
  and stripe_subscription_id is null;

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_org_id uuid;
  org_slug text;
  fallback_name text;
begin
  fallback_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  org_slug := regexp_replace(
    lower(split_part(new.email, '@', 1)),
    '[^a-z0-9]',
    '-',
    'g'
  ) || '-' || substr(new.id::text, 1, 6);

  insert into public.organizations (
    name,
    slug,
    plan,
    subscription_status,
    trial_ends_at
  )
  values (
    fallback_name,
    org_slug,
    'trial',
    'trial',
    now() + interval '14 days'
  )
  returning id into new_org_id;

  insert into public.memberships (
    organization_id,
    user_id,
    role,
    full_name
  )
  values (
    new_org_id,
    new.id,
    'owner',
    fallback_name
  );

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
