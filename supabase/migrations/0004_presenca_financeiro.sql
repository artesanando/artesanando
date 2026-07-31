-- M4: encontros/presenças e caixa do projeto.

create table public.encontros (
  id uuid primary key default gen_random_uuid(),
  semestre_id uuid references public.semestres (id) on delete set null,
  data date not null,
  hora text,
  local text,
  pauta text,
  created_at timestamptz not null default now()
);

create table public.presencas (
  encontro_id uuid not null references public.encontros (id) on delete cascade,
  integrante_id uuid not null references public.profiles (id) on delete cascade,
  presente boolean not null default true,
  marcado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (encontro_id, integrante_id) -- chamada = upsert nessa PK
);

create table public.movimentacoes (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  descricao text not null,
  categoria text not null default 'outros',
  tipo text not null check (tipo in ('entrada', 'saida')),
  valor_centavos int not null check (valor_centavos > 0), -- dinheiro sempre em centavos
  criado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Roles ----------

alter table public.encontros enable row level security;
alter table public.presencas enable row level security;
alter table public.movimentacoes enable row level security;

create policy encontros_select on public.encontros for select to authenticated using (true);
create policy presencas_select on public.presencas for select to authenticated using (true);
create policy movimentacoes_select on public.movimentacoes for select to authenticated using (true);

-- encontros e chamada: só admin
create policy encontros_write_admin on public.encontros
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy presencas_write_admin on public.presencas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- caixa: quem tem a permissão 'financeiro' (admin sempre); sem ela nem via API grava
create policy movimentacoes_insert on public.movimentacoes
  for insert to authenticated with check (public.has_perm('financeiro'));
create policy movimentacoes_update on public.movimentacoes
  for update to authenticated using (public.has_perm('financeiro')) with check (public.has_perm('financeiro'));
create policy movimentacoes_delete_admin on public.movimentacoes
  for delete to authenticated using (public.is_admin());
