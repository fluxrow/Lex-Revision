# Supabase remoto — caminho de producao

## Objetivo

Subir o Lex para um projeto Supabase fora da maquina local, para liberar:

- login real
- signup/ativacao real
- dashboard operacional
- persistencia real de contratos, equipe, clientes e billing

## O que precisa existir no projeto remoto

1. Um novo projeto Supabase
2. As migrations do diretório `supabase/migrations/`
3. Auth habilitado
4. URL e anon key publicas
5. Service role key para automacoes seguras no backend

## Ordem segura

1. Criar o projeto Supabase remoto
2. Vincular o projeto local ao remoto
3. Aplicar as migrations
4. Configurar envs no Vercel
5. Testar login owner
6. Testar ativacao, equipe, contratos e billing
7. Desligar o `preview admin`

## Envs obrigatorias no Vercel

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Envs temporarias para validacao sem Supabase remoto

- `LEX_PREVIEW_ADMIN_ENABLED`
- `LEX_PREVIEW_ADMIN_EMAIL`
- `LEX_PREVIEW_ADMIN_PASSWORD`
- `LEX_PREVIEW_ADMIN_SECRET`
- `NEXT_PUBLIC_LEX_PREVIEW_ADMIN_ENABLED`
- `NEXT_PUBLIC_LEX_PREVIEW_ADMIN_EMAIL`

## Observacao

O preview admin serve para navegacao e validacao interna de interface.
Nao substitui o ambiente real e nao deve permanecer ativo depois que o Supabase remoto estiver pronto.
