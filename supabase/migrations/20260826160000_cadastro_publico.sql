-- Cadastro público: a integrante se cadastra sozinha em /cadastro, com nome,
-- usuário e senha. O link vai no grupo e não existe botão para ele no app.
--
-- O endpoint é o próprio `auth.signUp`: nenhuma tabela nova, nenhuma policy
-- nova, e `handle_new_user` já cria a linha em `profiles`. Falta só saber, antes
-- de mandar, se o usuário escolhido está livre.

-- O usuário escolhido vira o identificador interno da conta e `profiles.usuario`
-- é unique. Sem checar antes, esbarrar numa ficha de chamada com o mesmo nome
-- estoura o unique DENTRO do trigger e o Auth responde "Database error saving
-- new user" — que não diz à pessoa o que ela precisa mudar.
create or replace function public.usuario_livre(usuario_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles p
     where lower(p.usuario) = lower(trim(usuario_input))
  );
$$;

grant execute on function public.usuario_livre(text) to anon, authenticated;
