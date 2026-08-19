-- Arquivar em vez de apagar.
--
-- Regra do app: o que tem histórico pendurado (presenças, produção, comentários,
-- empréstimos) é ARQUIVADO — some das listas, dá para restaurar. Só o que não tem
-- nada pendurado pode ser EXCLUÍDO de verdade. `pode_excluir` é a fonte única dessa
-- decisão, consultada pela UI para escolher entre oferecer Arquivar ou Excluir.

alter table public.projetos add column arquivado_em timestamptz;
alter table public.encontros add column arquivado_em timestamptz;
alter table public.receitas add column arquivado_em timestamptz;
alter table public.movimentacoes add column arquivado_em timestamptz;
alter table public.estoque_itens add column arquivado_em timestamptz;

create index projetos_ativos_idx on public.projetos (created_at) where arquivado_em is null;
create index encontros_ativos_idx on public.encontros (data desc) where arquivado_em is null;
create index receitas_ativas_idx on public.receitas (created_at) where arquivado_em is null;
create index movimentacoes_ativas_idx on public.movimentacoes (data desc) where arquivado_em is null;
create index estoque_itens_ativos_idx on public.estoque_itens (nome) where arquivado_em is null;

create or replace function public.pode_excluir(tabela text, alvo uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  case tabela
    when 'projetos' then
      return not exists (select 1 from public.squares where projeto_id = alvo and etapa <> 'afazer')
         and not exists (select 1 from public.faixas where projeto_id = alvo and status <> 'afazer')
         and not exists (select 1 from public.unidades where projeto_id = alvo)
         and not exists (select 1 from public.comentarios where projeto_id = alvo);

    when 'encontros' then
      return not exists (select 1 from public.presencas where encontro_id = alvo);

    when 'receitas' then
      return not exists (select 1 from public.projetos where receita_id = alvo);

    when 'estoque_itens' then
      return not exists (select 1 from public.emprestimos where item_id = alvo)
         and not exists (select 1 from public.estoque_movimentos where item_id = alvo);

    when 'movimentacoes' then
      return true;

    when 'profiles' then
      return alvo is distinct from public.meu_perfil_id()
         and not exists (select 1 from public.presencas where integrante_id = alvo)
         and not exists (select 1 from public.unidades where responsavel_id = alvo)
         and not exists (select 1 from public.faixas where responsavel_id = alvo)
         and not exists (select 1 from public.comentarios where autor_id = alvo)
         and not exists (select 1 from public.emprestimos where integrante_id = alvo)
         and not exists (select 1 from public.atividades where autor_id = alvo);

    else
      return false;
  end case;
end;
$$;
