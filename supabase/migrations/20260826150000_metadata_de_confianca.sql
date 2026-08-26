-- `handle_new_user` lia `papel` e `perfil_id` de `raw_user_meta_data` — o
-- metadata que o navegador escreve. Enquanto só a administradora criava conta
-- isso não aparecia; com o cadastro público de /cadastro, um POST em
-- /auth/v1/signup com `papel: "admin"` nasce administradora, e um com
-- `perfil_id` assume a ficha de outra pessoa.
--
-- A separação passa a ser pela origem do dado:
--   `raw_app_meta_data`  - só a service role escreve (a Edge Function do convite)
--   `raw_user_meta_data` - o navegador escreve; nada aqui decide permissão
--
-- Sai junto o vínculo automático por nome de usuário. Quem entrou pela chamada
-- passa a ser ligada só pelo convite, com o id explícito: sem isso, cadastrar-se
-- com o usuário de outra herdava a ficha dela.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario text := coalesce(new.raw_user_meta_data ->> 'usuario', split_part(new.email, '@', 1));
  v_pedido uuid := nullif(new.raw_app_meta_data ->> 'perfil_id', '')::uuid;
  v_papel text := case
    when new.raw_app_meta_data ->> 'papel' = 'admin' then 'admin'
    else 'integrante'
  end;
  v_perfil uuid;
  v_desde text;
begin
  if v_pedido is not null then
    select p.id into v_perfil
      from public.profiles p
     where p.id = v_pedido and p.user_id is null;
  end if;

  if v_perfil is not null then
    update public.profiles
       set user_id = new.id,
           ativo = true,
           nome = coalesce(new.raw_user_meta_data ->> 'nome', nome),
           usuario = coalesce(new.raw_user_meta_data ->> 'usuario', usuario),
           telefone = coalesce(new.raw_user_meta_data ->> 'telefone', telefone),
           preferencia = coalesce(new.raw_user_meta_data ->> 'preferencia', preferencia),
           turno = coalesce(new.raw_user_meta_data ->> 'turno', turno),
           papel = v_papel
     where id = v_perfil;
    return new;
  end if;

  -- Quem se cadastra sozinha entra no semestre aberto. `desde` vazio a deixaria
  -- fora de Integrantes, que lista por semestre — e é lá que a coordenação
  -- confere se o link funcionou.
  select s.label into v_desde from public.semestres s where s.ativo limit 1;

  insert into public.profiles (
    nome, usuario, telefone, preferencia, turno, avatar_color, papel, desde, user_id
  )
  values (
    coalesce(new.raw_user_meta_data ->> 'nome', v_usuario),
    v_usuario,
    new.raw_user_meta_data ->> 'telefone',
    coalesce(new.raw_user_meta_data ->> 'preferencia', 'ambos'),
    coalesce(new.raw_user_meta_data ->> 'turno', 'ambos'),
    public.cor_de_avatar(),
    v_papel,
    v_desde,
    new.id
  );
  return new;
end;
$$;
