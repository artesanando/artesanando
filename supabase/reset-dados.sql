-- Apaga TODOS os dados transacionais, preservando quem são as pessoas.
-- Uso: colar no SQL Editor do Supabase e rodar. Não é uma migration — nunca
-- é aplicado automaticamente pela integração do GitHub.
--
-- Preserva: profiles, permissoes, semestres.
-- Apaga: projetos e produção, encontros e chamada, estoque e empréstimos,
--        biblioteca, caixa e o feed de atividades.
--
-- ATENÇÃO: os PDFs no bucket `receitas` e as fotos no bucket `avatares` NÃO
-- saem daqui. Apague-os pelo Storage se quiser limpeza completa.

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
  public.movimentacoes
  restart identity cascade;

commit;
