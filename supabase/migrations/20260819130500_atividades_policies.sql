-- O feed de atividades só tinha policy de SELECT e INSERT: uma vez registrada, nem a
-- autora nem a admin conseguiam corrigir ou apagar uma linha. Isso também travava
-- qualquer limpeza de dados de teste pelo app.

create policy atividades_update on public.atividades
  for update to authenticated
  using (autor_id = public.meu_perfil_id() or public.is_admin())
  with check (autor_id = public.meu_perfil_id() or public.is_admin());

create policy atividades_delete on public.atividades
  for delete to authenticated
  using (autor_id = public.meu_perfil_id() or public.is_admin());
