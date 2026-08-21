-- Apaga TODOS os dados transacionais, preservando quem são as pessoas.
-- Uso: colar no SQL Editor do Supabase e rodar. Não é uma migration — nunca
-- é aplicado automaticamente pela integração do GitHub.
--
-- Preserva: profiles (com RA e nível), permissoes, semestres e as regras de
--           crédito do semestre.
-- Apaga: projetos e produção, encontros e chamada, estoque e empréstimos,
--        biblioteca, caixa, arquivos da extensão, marcas de crédito, o diário
--        de auditoria e o feed de atividades.
--
-- ATENÇÃO: os arquivos nos buckets `receitas`, `avatares`, `capas`,
-- `comentarios` e `extensao` NÃO saem daqui. Apague-os pelo Storage se quiser
-- limpeza completa.

begin;

truncate table
  public.presencas,
  public.encontros,
  public.comentarios,
  public.atividades,
  public.squares,
  public.faixas,
  public.unidades,
  public.manta_modelos,
  public.projetos,
  public.devolucoes,
  public.emprestimos,
  public.estoque_movimentos,
  public.estoque_itens,
  public.receitas,
  public.arquivos_extensao,
  public.credito_marcas,
  public.auditoria,
  public.movimentacoes
  restart identity cascade;

commit;
