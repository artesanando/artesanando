-- O square passa a lembrar quem fez cada metade.
--
-- `responsavel_id` é uma coluna só e era sobrescrita a cada mudança de etapa:
-- quem fazia o miolo sumia no instante em que outra pessoa marcava a borda. Como
-- o normal aqui é duas pessoas dividirem o mesmo square, a entrega de metade do
-- trabalho simplesmente não tinha onde ser registrada.

alter table public.squares
  add column miolo_por uuid references public.profiles (id) on delete set null,
  add column borda_por uuid references public.profiles (id) on delete set null;

create index squares_miolo_idx on public.squares (miolo_por) where miolo_por is not null;
create index squares_borda_idx on public.squares (borda_por) where borda_por is not null;

-- o que já está feito foi feito por quem está no responsavel_id: square pronto
-- teve as duas metades pela mesma pessoa; parado no miolo, só a primeira
update public.squares
   set miolo_por = responsavel_id, borda_por = responsavel_id
 where etapa = 'pronto' and responsavel_id is not null;

update public.squares
   set miolo_por = responsavel_id
 where etapa in ('miolo', 'aguardando_borda', 'borda') and responsavel_id is not null;

update public.squares
   set borda_por = responsavel_id
 where etapa = 'borda' and responsavel_id is not null;
