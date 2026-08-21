-- Diário de auditoria.
--
-- Escopo: as quatro coisas que mexem em quem leva crédito de extensão, ou em
-- quem pode dar crédito. Nível é editável pela própria integrante, então o
-- controle contra troca oportunista é este registro, não uma trava.
--
-- Escrita só por gatilho `security definer`: não há policy de insert, de modo
-- que ninguém escreve no diário pela API, nem para si nem contra outra.

create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid references public.profiles (id) on delete set null,
  alvo_id uuid references public.profiles (id) on delete set null,
  acao text not null check (acao in ('nivel', 'presenca', 'entrega', 'permissao', 'credito')),
  detalhe jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index auditoria_tempo_idx on public.auditoria (created_at desc);
create index auditoria_alvo_idx on public.auditoria (alvo_id, created_at desc);

alter table public.auditoria enable row level security;

create policy auditoria_read_admin on public.auditoria
  for select to authenticated using (public.is_admin());

create or replace function public.registra_auditoria(
  p_acao text,
  p_alvo uuid,
  p_detalhe jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.auditoria (autor_id, alvo_id, acao, detalhe)
  values (public.meu_perfil_id(), p_alvo, p_acao, coalesce(p_detalhe, '{}'::jsonb));
$$;

-- ---------- Nível ----------

create or replace function public.audita_nivel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.nivel is distinct from old.nivel then
    perform public.registra_auditoria(
      'nivel', new.id, jsonb_build_object('de', old.nivel, 'para', new.nivel)
    );
  end if;
  return null;
end;
$$;

create trigger profiles_audita_nivel
after update on public.profiles
for each row execute function public.audita_nivel();

-- ---------- Presença ----------

create or replace function public.audita_presenca()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- upsert que não mudou nada não vira linha no diário
  if tg_op = 'UPDATE' and new.presente is not distinct from old.presente then
    return null;
  end if;
  perform public.registra_auditoria(
    'presenca',
    new.integrante_id,
    jsonb_build_object('encontro_id', new.encontro_id, 'presente', new.presente)
  );
  return null;
end;
$$;

create trigger presencas_audita
after insert or update on public.presencas
for each row execute function public.audita_presenca();

-- ---------- Entregas ----------

create or replace function public.audita_entrega()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo text;
  v_pronto boolean;
  v_era boolean;
  v_alvo uuid;
begin
  if tg_table_name = 'unidades' then
    v_tipo := 'amigurumi';
    v_pronto := new.status = 'concluida';
    v_era := tg_op = 'UPDATE' and old.status = 'concluida';
    v_alvo := new.responsavel_id;
  elsif tg_table_name = 'faixas' then
    v_tipo := 'faixa';
    v_pronto := new.status = 'feita';
    v_era := tg_op = 'UPDATE' and old.status = 'feita';
    v_alvo := new.responsavel_id;
  else
    v_tipo := 'granny';
    v_pronto := new.etapa = 'pronto';
    v_era := tg_op = 'UPDATE' and old.etapa = 'pronto';
    v_alvo := new.responsavel_id;
  end if;

  -- só a passagem para pronto interessa; reabrir e remarcar não repetem a linha
  if v_pronto and not v_era then
    perform public.registra_auditoria(
      'entrega', v_alvo, jsonb_build_object('tipo', v_tipo, 'projeto_id', new.projeto_id)
    );
  end if;
  return null;
end;
$$;

create trigger unidades_audita
after insert or update on public.unidades
for each row execute function public.audita_entrega();

create trigger faixas_audita
after insert or update on public.faixas
for each row execute function public.audita_entrega();

create trigger squares_audita
after insert or update on public.squares
for each row execute function public.audita_entrega();

-- ---------- Permissões ----------

create or replace function public.audita_permissao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chave text;
  v_de boolean;
  v_para boolean;
begin
  foreach v_chave in array array['progresso', 'devolucoes', 'comentarios', 'financeiro', 'presenca'] loop
    v_de := (to_jsonb(old) ->> v_chave)::boolean;
    v_para := (to_jsonb(new) ->> v_chave)::boolean;
    if v_de is distinct from v_para then
      perform public.registra_auditoria(
        'permissao', new.profile_id, jsonb_build_object('chave', v_chave, 'para', v_para)
      );
    end if;
  end loop;
  return null;
end;
$$;

create trigger permissoes_audita
after update on public.permissoes
for each row execute function public.audita_permissao();
