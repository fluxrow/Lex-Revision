# Lex Revision — Supabase Setup

## Inicialização

```bash
pnpm dlx supabase init
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <SEU_REF>
```

## Aplicar schema

```bash
# Cole db/schema.sql e db/policies.sql no SQL Editor do dashboard,
# ou via CLI:
psql "$DATABASE_URL" < db/schema.sql
psql "$DATABASE_URL" < db/policies.sql
```

## Storage buckets

Crie no dashboard (Storage → New bucket):

| Bucket | Visibilidade | Uso |
|--------|--------------|-----|
| `templates` | Privado | .docx originais dos modelos |
| `contracts` | Privado | PDFs gerados (rascunhos) |
| `signed`    | Privado | PDFs assinados (com selo digital) |
| `logos`     | Público | Logos das organizações |

Policy de exemplo (`templates`):
```sql
create policy "members read templates" on storage.objects
for select using (
  bucket_id = 'templates'
  and (storage.foldername(name))[1] = auth.user_organizations()::text
);
```

## Auth

- **Email + senha** (signup) — fluxo padrão Supabase Auth
- **Google OAuth** — habilitar em Authentication → Providers → Google
- **Magic link** (opcional, para signatários externos receberem link de assinatura)
- **Custom claim:** `organization_id` no JWT — adicionar via hook:

```sql
-- Hook: auth.users → injeta org_id no token
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql as $$
declare org_id uuid;
begin
  select organization_id into org_id
  from public.memberships
  where user_id = (event->>'user_id')::uuid
  limit 1;
  return jsonb_set(event, '{claims,organization_id}', to_jsonb(org_id));
end; $$;
```

Habilite o hook em **Authentication → Hooks**.

## Edge Functions

Crie em `supabase/functions/`:

### `extract-variables/index.ts`
Recebe `.docx` no Storage, parseia com `docx` lib, retorna lista de variáveis `{{NOME}}`.

```ts
import { serve } from 'std/http/server.ts'
import * as docx from 'npm:docx-parser'

serve(async (req) => {
  const { storage_path } = await req.json()
  const file = await supabase.storage.from('templates').download(storage_path)
  const text = await docx.parseDocx(file)
  const vars = [...text.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1])
  return Response.json({ variables: [...new Set(vars)] })
})
```

### `generate-contract/index.ts`
Recebe um prompt em pt-BR, usa Claude para gerar contrato completo.

### `suggest-clauses/index.ts`
Recebe contrato existente, retorna sugestões de cláusulas faltantes (foro, confidencialidade, reajuste, multa).

### Deploy:
```bash
supabase functions deploy extract-variables
supabase functions deploy generate-contract
supabase functions deploy suggest-clauses
```

## Variáveis de ambiente

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # NUNCA expor no client
```

## Backups e disaster recovery

- Habilite **PITR** (Point-in-Time Recovery) — Pro plan
- Backup diário automático: ✅ por padrão no Supabase
- Exportar `contracts.body_md` semanalmente para S3 como redundância
