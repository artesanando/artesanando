-- Cor do avatar deixa de ser escolhida e passa a ser sorteada.
--
-- O campo saiu de "Meu perfil". Quem já tem cor mantém a dela: a migration não
-- toca em perfil nenhum, só muda o padrão de quem nascer daqui em diante — que
-- até agora era '#C4798A' fixo, deixando toda integrante criada pela chamada
-- com exatamente a mesma cor.

create or replace function public.cor_de_avatar()
returns text
language sql
volatile
as $$
  select (array[
    '#DFA2AC', '#E3C07A', '#7D9B76', '#A9BFA3',
    '#B99BC4', '#ECD97C', '#8FA3B8', '#C4798A'
  ])[floor(random() * 8) + 1];
$$;

alter table public.profiles alter column avatar_color set default public.cor_de_avatar();

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
    public.cor_de_avatar(),
    coalesce(new.raw_user_meta_data ->> 'papel', 'integrante'),
    new.raw_user_meta_data ->> 'desde',
    new.id
  );
  return new;
end;
$$;
