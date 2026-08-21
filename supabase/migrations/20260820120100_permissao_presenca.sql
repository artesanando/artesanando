-- Quinta chave de permissão: presença.
--
-- A chamada era `is_admin()` puro, no front e aqui. Passa a ser uma permissão
-- delegável, cobrindo marcar presença e também agendar, editar e cancelar
-- encontro — quem toca a chamada é quem toca o calendário.
--
-- Junto disso, comentar deixa de pedir permissão: qualquer integrante logada
-- escreve, em projeto ou na biblioteca. A chave `comentarios` sobrevive com
-- outro sentido — moderação, isto é, apagar comentário alheio.

alter table public.permissoes add column presenca boolean not null default false;

create or replace function public.has_perm(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or coalesce((
    select case perm
      when 'progresso' then pm.progresso
      when 'devolucoes' then pm.devolucoes
      when 'comentarios' then pm.comentarios
      when 'financeiro' then pm.financeiro
      when 'presenca' then pm.presenca
      else false
    end
    from public.permissoes pm
    where pm.profile_id = public.meu_perfil_id()
  ), false);
$$;

-- ---------- Presença e encontros ----------

drop policy encontros_write_admin on public.encontros;
create policy encontros_write on public.encontros
  for all to authenticated
  using (public.has_perm('presenca'))
  with check (public.has_perm('presenca'));

drop policy presencas_write_admin on public.presencas;
create policy presencas_write on public.presencas
  for all to authenticated
  using (public.has_perm('presenca'))
  with check (public.has_perm('presenca'));

-- ---------- Comentários ----------

-- escrever é de qualquer autenticada; o `autor_id` continua tendo que ser o dela
drop policy comentarios_insert on public.comentarios;
create policy comentarios_insert on public.comentarios
  for insert to authenticated
  with check (autor_id = public.meu_perfil_id());

-- editar segue só da autora (ou admin) — moderação apaga, não reescreve
drop policy comentarios_delete on public.comentarios;
create policy comentarios_delete on public.comentarios
  for delete to authenticated
  using (autor_id = public.meu_perfil_id() or public.has_perm('comentarios'));
