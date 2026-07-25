-- M3: projetos e produção (mantas de crochê/tricô e amigurumis).

create table public.projetos (
  id uuid primary key default gen_random_uuid(),
  semestre_id uuid references public.semestres (id) on delete set null,
  nome text not null,
  tipo text not null check (tipo in ('manta_croche', 'manta_trico', 'amigurumi')),
  destino text,
  emoji text,
  receita_id uuid references public.receitas (id) on delete set null,
  meta int, -- amigurumi: meta de unidades
  status text not null default 'ativo' check (status in ('ativo', 'entregue', 'arquivado')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.manta_modelos (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  letra text not null,
  nome text not null,
  cor_borda text not null,
  cor_miolo text not null,
  responsavel_id uuid references public.profiles (id) on delete set null,
  total int not null default 0,
  unique (projeto_id, letra)
);

create table public.lotes (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  modelo_id uuid not null references public.manta_modelos (id) on delete cascade,
  quantidade int not null check (quantidade > 0),
  etapa text not null check (etapa in ('miolo', 'aguardando_borda', 'borda', 'pronto')),
  responsavel_id uuid references public.profiles (id) on delete set null, -- null = "precisa de alguém"
  obs text,
  created_at timestamptz not null default now()
);

create table public.squares (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  modelo_id uuid not null references public.manta_modelos (id) on delete cascade,
  posicao int not null check (posicao >= 0),
  etapa text not null default 'afazer'
    check (etapa in ('afazer', 'miolo', 'aguardando_borda', 'borda', 'pronto')),
  lote_id uuid references public.lotes (id) on delete set null,
  unique (projeto_id, posicao)
);

create table public.faixas (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  ordem int not null,
  responsavel_id uuid references public.profiles (id) on delete set null,
  status text not null default 'afazer' check (status in ('afazer', 'fazendo', 'feita')),
  cores jsonb not null default '[]', -- array de hex
  unique (projeto_id, ordem)
);

-- Faixa concluída fica somente-leitura (só admin ou quem concluiu reabre/edita)
create or replace function public.guard_faixa_feita()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'feita' and not public.is_admin() and old.responsavel_id is distinct from auth.uid()
    and (new.cores is distinct from old.cores or new.ordem is distinct from old.ordem) then
    raise exception 'faixa concluída não pode ser editada';
  end if;
  return new;
end;
$$;

create trigger faixas_guard_feita
before update on public.faixas
for each row execute function public.guard_faixa_feita();

create table public.unidades (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  numero int not null check (numero > 0),
  responsavel_id uuid references public.profiles (id) on delete set null,
  status text not null default 'em_producao' check (status in ('em_producao', 'concluida')),
  unique (projeto_id, numero)
);

create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  autor_id uuid not null references public.profiles (id) on delete cascade,
  texto text not null,
  created_at timestamptz not null default now()
);

create table public.atividades (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid references public.profiles (id) on delete set null,
  tipo text not null, -- 'producao' | 'lote' | 'faixa' | 'unidade' | 'projeto' | ...
  projeto_id uuid references public.projetos (id) on delete cascade,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- Roles ----------

alter table public.projetos enable row level security;
alter table public.manta_modelos enable row level security;
alter table public.lotes enable row level security;
alter table public.squares enable row level security;
alter table public.faixas enable row level security;
alter table public.unidades enable row level security;
alter table public.comentarios enable row level security;
alter table public.atividades enable row level security;

create policy projetos_select on public.projetos for select to authenticated using (true);
create policy modelos_select on public.manta_modelos for select to authenticated using (true);
create policy lotes_select on public.lotes for select to authenticated using (true);
create policy squares_select on public.squares for select to authenticated using (true);
create policy faixas_select on public.faixas for select to authenticated using (true);
create policy unidades_select on public.unidades for select to authenticated using (true);
create policy comentarios_select on public.comentarios for select to authenticated using (true);
create policy atividades_select on public.atividades for select to authenticated using (true);

-- estrutura do projeto: só admin
create policy projetos_write_admin on public.projetos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy modelos_write_admin on public.manta_modelos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- progresso: quem tem a permissão 'progresso' (admin sempre)
create policy lotes_write on public.lotes
  for all to authenticated using (public.has_perm('progresso')) with check (public.has_perm('progresso'));
create policy squares_write on public.squares
  for all to authenticated using (public.has_perm('progresso')) with check (public.has_perm('progresso'));
create policy faixas_write on public.faixas
  for all to authenticated using (public.has_perm('progresso')) with check (public.has_perm('progresso'));
create policy unidades_write on public.unidades
  for all to authenticated using (public.has_perm('progresso')) with check (public.has_perm('progresso'));

-- comentários: insere quem tem a permissão, edita/apaga autora ou admin
create policy comentarios_insert on public.comentarios
  for insert to authenticated with check (public.has_perm('comentarios') and autor_id = auth.uid());
create policy comentarios_update on public.comentarios
  for update to authenticated
  using (autor_id = auth.uid() or public.is_admin())
  with check (autor_id = auth.uid() or public.is_admin());
create policy comentarios_delete on public.comentarios
  for delete to authenticated using (autor_id = auth.uid() or public.is_admin());

-- feed de atividades: qualquer autenticada registra a própria atividade
create policy atividades_insert on public.atividades
  for insert to authenticated with check (autor_id = auth.uid());
