-- Estoque: corrige a categoria que o front usa mas o banco recusava, e passa a
-- registrar POR QUE a quantidade mudou.
--
-- Bug corrigido: o check aceitava 'outros' e não aceitava 'enchimento', mas
-- src/types/database.ts e a aba da tela sempre mandaram 'enchimento' — cadastrar
-- material de enchimento falhava com erro de constraint.

alter table public.estoque_itens drop constraint estoque_itens_categoria_check;
alter table public.estoque_itens add constraint estoque_itens_categoria_check
  check (categoria in ('novelos', 'agulhas', 'olhos', 'enchimento', 'feira'));

-- ---------- Histórico de movimentação ----------

create table public.estoque_movimentos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.estoque_itens (id) on delete cascade,
  delta int not null check (delta <> 0), -- positivo entra, negativo sai
  motivo text not null check (motivo in ('compra', 'doacao', 'ajuste', 'perda', 'venda')),
  obs text,
  criado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index estoque_movimentos_item_idx on public.estoque_movimentos (item_id, created_at desc);

-- aplica o delta no item; venda também acumula em `vendidos`
create or replace function public.aplica_estoque_movimento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  atual int;
begin
  select quantidade into atual
    from public.estoque_itens where id = new.item_id for update;

  if atual + new.delta < 0 then
    raise exception 'saída maior que o estoque: há % em posse e a saída é de %', atual, abs(new.delta);
  end if;

  update public.estoque_itens
     set quantidade = quantidade + new.delta,
         vendidos = vendidos + case when new.motivo = 'venda' then abs(new.delta) else 0 end
   where id = new.item_id;

  return new;
end;
$$;

create trigger estoque_movimentos_aplica
before insert on public.estoque_movimentos
for each row execute function public.aplica_estoque_movimento();

-- ---------- Roles ----------

alter table public.estoque_movimentos enable row level security;

create policy estoque_movimentos_select on public.estoque_movimentos
  for select to authenticated using (true);

-- repor estoque acompanha a permissão de empréstimos/devoluções (ver 130600)
create policy estoque_movimentos_insert on public.estoque_movimentos
  for insert to authenticated with check (public.has_perm('devolucoes'));

create policy estoque_movimentos_delete_admin on public.estoque_movimentos
  for delete to authenticated using (public.is_admin());
