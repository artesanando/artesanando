# Setup do Supabase (M1)

Passo a passo para colocar o backend de pé:

1. **Criar o projeto** em [supabase.com](https://supabase.com) (org gratuita serve).
2. **Rodar a migration**: abra *SQL Editor* no painel e execute o conteúdo de
   [`migrations/0001_init.sql`](migrations/0001_init.sql), depois [`seed.sql`](seed.sql).
   (Alternativa com CLI: `supabase link` + `supabase db push`.)
3. **Variáveis do front**: copie `.env.example` para `.env` e preencha
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (*Project Settings → API*).
   Na Vercel, cadastre as mesmas variáveis no projeto.
4. **Primeira usuária (admin)**:

   ```bash
   SUPABASE_URL=https://xxx.supabase.co \
   SUPABASE_SERVICE_ROLE_KEY=... \
   ADMIN_EMAIL=voce@exemplo.com \
   ADMIN_PASSWORD=... \
   ADMIN_NOME="Seu Nome" \
   ADMIN_USUARIO=seu.usuario \
   node scripts/create-admin.mjs
   ```

   As demais integrantes são convidadas depois, já logada, pela tela de Integrantes
   (usa a Edge Function `invite-member` do passo 5).

5. **Edge Function de convite**:

   ```bash
   supabase functions deploy invite-member
   ```

   A service role já fica disponível para a function automaticamente.
6. **Emails (esqueci a senha / convite)**: o SMTP padrão do Supabase limita ~2
   emails/hora — para uso real, configure um SMTP próprio (Resend/Brevo) em
   *Authentication → SMTP Settings* e ajuste a URL do site em
   *Authentication → URL Configuration* (Site URL = URL da Vercel; adicione
   `/redefinir-senha` e `/definir-senha` às Redirect URLs).

A service role **nunca** vai no front — só em Edge Functions e scripts.
