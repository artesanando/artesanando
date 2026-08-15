# Artesanando

Aplicativo de gestão do projeto de extensão de crochê e tricô — mantas, amigurumis, materiais, encontros e caixa do projeto, tudo no mesmo lugar.

**Stack:** React + Vite + TypeScript · [Supabase](https://supabase.com) (Postgres, Auth, RLS, Storage) · TanStack Query · deploy na Vercel.

## Funcionalidades

- **Login** por usuário ou email, com "manter conectada" e recuperação de senha por email; integrantes entram por convite.
- **Dashboard** derivado do banco: KPIs, projetos em produção e feed de atividades.
- **Projetos** — mantas (crochê e tricô) e amigurumis, cada um com a própria tela:
  - **Manta de crochê** — fluxo por lotes (miolo → aguardando borda → borda → pronto), "pegar lote" e mapa dos squares.
  - **Manta de tricô** — editor de ordem de cores por faixa; faixa concluída fica somente-leitura.
  - **Amigurumi** — unidades por integrante com meta e conclusão.
- **Estoque** — 5 categorias, empréstimos com devolução parcial (o banco encerra o empréstimo na devolução total).
- **Biblioteca** — receitas com busca/filtros, PDF no Storage e criadores de padrão (granny, faixa, esquema de manta) que salvam de verdade.
- **Presença** — encontros com chamada clicável (upsert) e frequência derivada.
- **Financeiro** — valores sempre em centavos, KPIs por agregação, escrita protegida por permissão.
- **Integrantes** — busca, painel com frequência/entregas/empréstimos.
- **Configurações** — permissões por integrante (progresso, devoluções, comentários, financeiro), aplicadas por RLS no banco.

## Como rodar

```bash
npm install
cp .env.example .env   # preencher com as chaves do Supabase
npm run dev
```

Sem `.env`, o app abre numa tela de instruções de setup. O passo a passo completo do backend
(migrations, seed, Edge Function de convite e SMTP) está em [supabase/README.md](supabase/README.md).

## Scripts

| Comando             | O que faz                        |
| ------------------- | -------------------------------- |
| `npm run dev`       | servidor de desenvolvimento      |
| `npm run build`     | typecheck + build de produção    |
| `npm run lint`      | ESLint                           |
| `npm run typecheck` | TypeScript (`tsc -b`)            |
| `npm test`          | Vitest (unit + smoke com fake)   |
| `npm run format`    | Prettier                         |

## Estrutura

```
src/
  lib/         supabase.ts · queryClient.ts · format.ts (dinheiro/datas pt-BR) · paleta.ts
  state/       auth.tsx (sessão + perfil + permissões) · store.tsx (estado de UI)
  components/  layout/ (shell, sidebar) · ui/ (controles) · ErrorBoundary
  features/    auth · dashboard · projetos · estoque · biblioteca ·
               presenca · financeiro · integrantes · perfil · config
               (cada uma com api.ts — fetchers + lógica derivada testada)
  modals/      modais do app (produção, empréstimo, criadores de padrão…)
supabase/      migrations/ · seed.sql · functions/invite-member/ · README.md
scripts/       create-admin.mjs (cria a primeira usuária admin via service role)
```

## Deploy

Push na `main` → CI (lint, typecheck, testes, build) → deploy automático na Vercel
(`vercel.json` cuida do rewrite de SPA). As variáveis `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY` precisam estar configuradas no projeto da Vercel; a service
role do Supabase vive apenas nas Edge Functions e nos scripts de seed — nunca no front.
