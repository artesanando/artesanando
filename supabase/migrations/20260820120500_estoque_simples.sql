-- Estoque mais simples: sai o mínimo, sai o motivo.
--
-- O mínimo só alimentava a tag ⚠ "acabando" da listagem — nenhuma query
-- filtrava por ele. Movimentar passa a ser só direção: entrada ou saída.
--
-- Os cinco motivos antigos continuam no CHECK porque o histórico é imutável
-- (não há policy de update em `estoque_movimentos`) e as linhas já gravadas
-- precisam seguir válidas e legíveis.

alter table public.estoque_itens drop column minimo;

alter table public.estoque_movimentos drop constraint estoque_movimentos_motivo_check;
alter table public.estoque_movimentos add constraint estoque_movimentos_motivo_check
  check (motivo in ('compra', 'doacao', 'ajuste', 'perda', 'venda', 'entrada', 'saida'));

-- `vendidos` era derivado de `motivo = 'venda'`, que deixa de existir no app.
-- Passa a sair da categoria: toda saída de item de feira é uma venda. O gatilho
-- é `before insert`, então nenhuma linha antiga é reprocessada — e o motivo novo
-- ('saida') nunca coincide com o antigo ('venda'), então nada conta em dobro.
create or replace function public.aplica_estoque_movimento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  atual int;
  cat text;
begin
  select quantidade, categoria into atual, cat
    from public.estoque_itens where id = new.item_id for update;

  if atual + new.delta < 0 then
    raise exception 'saída maior que o estoque: há % em posse e a saída é de %', atual, abs(new.delta);
  end if;

  update public.estoque_itens
     set quantidade = quantidade + new.delta,
         vendidos = vendidos + case
           when new.delta < 0 and (cat = 'feira' or new.motivo = 'venda') then abs(new.delta)
           else 0
         end
   where id = new.item_id;

  return new;
end;
$$;
