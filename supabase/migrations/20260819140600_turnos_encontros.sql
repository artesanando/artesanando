-- O projeto se encontra de dia E de noite, e a frequência precisa ser contada
-- separada e inteira. O turno é do ENCONTRO (um encontro acontece de dia ou de
-- noite) e também da INTEGRANTE, porque quem só vem à noite não pode levar falta
-- por encontro diurno — o denominador do total dela é o turno dela.
--
-- `ambos` é o padrão da integrante: reproduz exatamente o comportamento de hoje
-- até a administradora classificar alguém.
--
-- Cancelar é diferente de arquivar: o encontro continua no calendário, riscado,
-- mas não abre chamada e sai das duas contas. Recesso não é falta de ninguém.

alter table public.encontros
  add column turno text not null default 'diurno' check (turno in ('diurno', 'noturno')),
  add column cancelado_em timestamptz,
  -- agrupa os encontros gerados de uma vez pela repetição semanal
  add column serie_id uuid;

create index encontros_serie_idx on public.encontros (serie_id) where serie_id is not null;

alter table public.profiles
  add column turno text not null default 'ambos' check (turno in ('diurno', 'noturno', 'ambos'));

-- ---------- O convite passa a carregar o turno ----------

-- A coluna acabou de nascer, então o trigger que cria/liga o perfil precisa
-- saber ler `turno` do metadata do convite. O resto do corpo é o da 140100.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario text := coalesce(new.raw_user_meta_data ->> 'usuario', split_part(new.email, '@', 1));
  v_pedido uuid := nullif(new.raw_user_meta_data ->> 'perfil_id', '')::uuid;
  v_perfil uuid;
begin
  if v_pedido is not null then
    select p.id into v_perfil
      from public.profiles p
     where p.id = v_pedido and p.user_id is null;
  end if;

  if v_perfil is null then
    select p.id into v_perfil
      from public.profiles p
     where p.user_id is null
       and (lower(p.usuario) = lower(v_usuario) or lower(p.email) = lower(new.email))
     order by (lower(p.usuario) = lower(v_usuario)) desc
     limit 1;
  end if;

  if v_perfil is not null then
    update public.profiles
       set user_id = new.id,
           email = new.email,
           ativo = true,
           nome = coalesce(new.raw_user_meta_data ->> 'nome', nome),
           usuario = coalesce(new.raw_user_meta_data ->> 'usuario', usuario),
           telefone = coalesce(new.raw_user_meta_data ->> 'telefone', telefone),
           preferencia = coalesce(new.raw_user_meta_data ->> 'preferencia', preferencia),
           turno = coalesce(new.raw_user_meta_data ->> 'turno', turno),
           papel = coalesce(new.raw_user_meta_data ->> 'papel', papel)
     where id = v_perfil;
    return new;
  end if;

  insert into public.profiles (
    nome, usuario, email, telefone, preferencia, turno, avatar_color, papel, desde, user_id
  )
  values (
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    v_usuario,
    new.email,
    new.raw_user_meta_data ->> 'telefone',
    coalesce(new.raw_user_meta_data ->> 'preferencia', 'ambos'),
    coalesce(new.raw_user_meta_data ->> 'turno', 'ambos'),
    coalesce(new.raw_user_meta_data ->> 'avatar_color', '#C4798A'),
    coalesce(new.raw_user_meta_data ->> 'papel', 'integrante'),
    new.raw_user_meta_data ->> 'desde',
    new.id
  );
  return new;
end;
$$;
