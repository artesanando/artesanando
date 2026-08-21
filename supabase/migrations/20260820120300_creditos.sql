-- Regras de crédito do semestre.
--
-- Um bloco é uma exigência; as linhas dentro dele são jeitos alternativos de
-- atendê-la. Blocos se somam (E), linhas se alternam (OU). Isso cobre os dois
-- casos reais sem aninhamento: "5 squares OU 1 faixa" E "75% de frequência",
-- e "3 amigurumis OU mentorar uma iniciante" E "75% de frequência".
--
-- As regras são de leitura geral porque cada integrante precisa ver a própria
-- meta. O que é restrito é a tabela de cumprimento das outras.

create table public.credito_blocos (
  id uuid primary key default gen_random_uuid(),
  semestre_id uuid not null references public.semestres (id) on delete cascade,
  nivel text not null check (nivel in ('iniciante', 'experiente')),
  ordem int not null default 0
);

create index credito_blocos_semestre_idx on public.credito_blocos (semestre_id, nivel, ordem);

create table public.credito_linhas (
  id uuid primary key default gen_random_uuid(),
  bloco_id uuid not null references public.credito_blocos (id) on delete cascade,
  tipo text not null check (tipo in ('amigurumi', 'granny', 'faixa', 'frequencia', 'mentoria')),
  -- porcentagem quando o tipo é 'frequencia'; contagem de peças nos demais
  quantidade numeric(5,1) not null default 1 check (quantidade > 0)
);

create index credito_linhas_bloco_idx on public.credito_linhas (bloco_id);

-- Cumprimento fora da conta: mentoria e o "dar como cumprido" da administradora
create table public.credito_marcas (
  semestre_id uuid not null references public.semestres (id) on delete cascade,
  perfil_id uuid not null references public.profiles (id) on delete cascade,
  mentoria boolean not null default false,
  cumprido boolean not null default false,
  motivo text,
  marcado_por uuid references public.profiles (id) on delete set null,
  marcado_em timestamptz not null default now(),
  primary key (semestre_id, perfil_id)
);

-- ---------- Roles ----------

alter table public.credito_blocos enable row level security;
alter table public.credito_linhas enable row level security;
alter table public.credito_marcas enable row level security;

create policy credito_blocos_select on public.credito_blocos
  for select to authenticated using (true);
create policy credito_blocos_write_admin on public.credito_blocos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy credito_linhas_select on public.credito_linhas
  for select to authenticated using (true);
create policy credito_linhas_write_admin on public.credito_linhas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- a marca de outra integrante não é da conta de ninguém
create policy credito_marcas_select on public.credito_marcas
  for select to authenticated
  using (perfil_id = public.meu_perfil_id() or public.is_admin());
create policy credito_marcas_write_admin on public.credito_marcas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Auditoria ----------

create or replace function public.audita_credito()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.registra_auditoria(
    'credito',
    new.perfil_id,
    jsonb_build_object(
      'semestre_id', new.semestre_id,
      'mentoria', new.mentoria,
      'cumprido', new.cumprido,
      'motivo', new.motivo
    )
  );
  return null;
end;
$$;

create trigger credito_marcas_audita
after insert or update on public.credito_marcas
for each row execute function public.audita_credito();
