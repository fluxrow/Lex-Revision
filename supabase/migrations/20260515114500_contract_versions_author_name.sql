alter table contract_versions
  add column if not exists created_by_name text;

update contract_versions
set created_by_name = memberships.full_name
from memberships
where memberships.user_id = contract_versions.created_by
  and memberships.organization_id = contract_versions.organization_id
  and (
    contract_versions.created_by_name is null
    or btrim(contract_versions.created_by_name) = ''
  );
