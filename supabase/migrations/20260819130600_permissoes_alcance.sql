-- As 4 chaves continuam as mesmas (progresso, devolucoes, comentarios, financeiro);
-- o que muda é o alcance de duas delas, agora que existem ações que antes não tinham
-- caminho nenhum no app.
--
--   progresso  → marcar etapa e responsável de square, trocar square de lugar,
--                pintar modelo, pegar e concluir faixa
--   devolucoes → cadastrar/editar material e lançar entrada de estoque
--
-- Continua só admin: estrutura do projeto (tamanho da manta, modelos, criar/remover
-- faixa), encontros, integrantes e exclusão de material.

-- ---------- Estoque: repor deixa de ser exclusividade da admin ----------

drop policy estoque_write_admin on public.estoque_itens;

create policy estoque_insert on public.estoque_itens
  for insert to authenticated with check (public.has_perm('devolucoes'));
create policy estoque_update on public.estoque_itens
  for update to authenticated
  using (public.has_perm('devolucoes')) with check (public.has_perm('devolucoes'));
create policy estoque_delete_admin on public.estoque_itens
  for delete to authenticated using (public.is_admin());

-- ---------- Squares: mexer no progresso ≠ mudar o tamanho da manta ----------

drop policy squares_write on public.squares;

create policy squares_update on public.squares
  for update to authenticated
  using (public.has_perm('progresso')) with check (public.has_perm('progresso'));
create policy squares_insert_admin on public.squares
  for insert to authenticated with check (public.is_admin());
create policy squares_delete_admin on public.squares
  for delete to authenticated using (public.is_admin());

-- ---------- Faixas: idem — reordenar/concluir ≠ criar ou remover faixa ----------

drop policy faixas_write on public.faixas;

create policy faixas_update on public.faixas
  for update to authenticated
  using (public.has_perm('progresso')) with check (public.has_perm('progresso'));
create policy faixas_insert_admin on public.faixas
  for insert to authenticated with check (public.is_admin());
create policy faixas_delete_admin on public.faixas
  for delete to authenticated using (public.is_admin());
