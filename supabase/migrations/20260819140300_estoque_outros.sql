-- "Olhos" e "Enchimento" viram uma aba só: Outros.
--
-- Na prática eram duas abas quase vazias, e todo material que não é novelo nem
-- agulha caía numa delas por falta de lugar melhor. O que distingue um item do
-- outro é o `detalhe`, não a aba.
--
-- Os itens existentes migram antes da troca da constraint; onde `detalhe` está
-- vazio ele passa a guardar de onde o item veio, para a informação não sumir.

begin;

update public.estoque_itens
   set detalhe = case categoria when 'olhos' then 'Olhos e segurança' else 'Enchimento' end
 where categoria in ('olhos', 'enchimento')
   and (detalhe is null or btrim(detalhe) = '');

update public.estoque_itens
   set categoria = 'outros'
 where categoria in ('olhos', 'enchimento');

alter table public.estoque_itens drop constraint estoque_itens_categoria_check;
alter table public.estoque_itens add constraint estoque_itens_categoria_check
  check (categoria in ('novelos', 'agulhas', 'outros', 'feira'));

commit;
