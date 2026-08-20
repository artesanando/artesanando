# Setup do Supabase

O schema é versionado em [`migrations/`](migrations) e aplicado no banco de produção
pela **integração do GitHub** — todo push na `main` sincroniza as migrations pendentes.
Nada de rodar SQL na mão no painel.

## Primeira vez

1. **Criar o projeto** em [supabase.com](https://supabase.com). Em *Security*, mantenha
   `Enable Data API` e `Automatically expose new tables` ligados: as migrations não
   trazem `grant` explícito, quem concede privilégio às roles `anon`/`authenticated` é
   essa opção. A proteção real é a RLS — todas as tabelas habilitam RLS com policies.

2. **Conectar o GitHub**: *Project Settings → Integrations → GitHub*. Repositório
   `artesanando/artesanando`, working directory `.`, *Deploy to production* ligado,
   production branch `main`. O `config.toml` deste diretório é o que a integração usa.

3. **Push na `main`** — a integração aplica as migrations e registra as versões em
   `supabase_migrations.schema_migrations`. Confira em *Table Editor* que as tabelas
   apareceram e em *Storage* que existem os buckets `receitas`, `avatares`, `capas` e
   `extensao`.

4. **Seed** — [`seed.sql`](seed.sql) **não** roda em produção (a integração só aplica
   migrations; seed vale para branches de preview e para o ambiente local). Ajuste as
   datas para o calendário real e rode uma vez no *SQL Editor*. É idempotente.

5. **Variáveis do front**: copie `.env.example` para `.env` e preencha
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (*Project Settings → API*).
   Cadastre as mesmas na Vercel — o Vite injeta no build, então precisam existir
   **antes** do primeiro deploy.

6. **Primeira usuária (admin)** — no PowerShell:

   ```powershell
   $env:SUPABASE_URL="https://xxx.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY="..."
   $env:ADMIN_EMAIL="voce@exemplo.com"
   $env:ADMIN_PASSWORD="..."
   $env:ADMIN_NOME="Seu Nome"
   $env:ADMIN_USUARIO="seu.usuario"
   node scripts/create-admin.mjs
   ```

   As demais integrantes são convidadas depois, já logada, pela tela de Integrantes
   (usa a Edge Function do passo 7).

7. **Edge Functions**:

   ```powershell
   npx supabase login
   npx supabase link --project-ref <ref>
   npx supabase functions deploy invite-member
   npx supabase functions deploy reset-password-link
   ```

   A service role fica disponível para as functions automaticamente. **Redeploy as duas
   sempre que mudarem** — elas identificam a chamadora por `profiles.user_id`, e uma
   versão antiga no servidor continua procurando por `profiles.id`.

8. **URLs de autenticação** — *Authentication → URL Configuration*: Site URL = URL da
   Vercel; adicione `/redefinir-senha` e `/definir-senha` às Redirect URLs. O `site_url`
   do `config.toml` aponta para o dev local e não substitui esta configuração.

9. **Emails** — o SMTP padrão limita ~2 emails/hora; para uso real configure um SMTP
   próprio (Resend/Brevo) em *Authentication → SMTP Settings* antes de convidar as
   integrantes.

## Apagar os dados de teste

[`reset-dados.sql`](reset-dados.sql) limpa tudo que é transacional (projetos, produção,
encontros, chamada, estoque, empréstimos, biblioteca, caixa e feed) e **preserva**
`profiles`, `permissoes` e `semestres` — você continua logada, com as mesmas integrantes.

Não é uma migration: cole no *SQL Editor* e rode quando quiser recomeçar. Os arquivos nos
buckets `receitas`, `avatares`, `capas` e `extensao` não saem no truncate — apague-os pelo
*Storage*.

## Nova migration

```powershell
npx supabase migration new nome_da_mudanca
```

Escreva o SQL no arquivo gerado, commit, push na `main`. Os arquivos seguem o padrão
`<timestamp>_nome.sql` e são aplicados em ordem — nunca edite uma migration já aplicada
em produção, crie a próxima.

A service role **nunca** vai no front — só em Edge Functions e scripts.
