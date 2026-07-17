-- M2: estoque, empréstimos/devoluções e biblioteca de receitas.

-- ---------- Estoque ----------

create table public.estoque_itens (
  id uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in ('novelos', 'agulhas', 'olhos', 'feira', 'outros')),
  nome text not null,
  detalhe text,
  cor_hex text,
  quantidade int not null default 0 check (quantidade >= 0), -- total em posse do projeto
  vendidos int not null default 0 check (vendidos >= 0), -- só itens de feira
  minimo int not null default 0, -- disponível <= minimo gera o alerta
  custo_centavos int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger estoque_itens_updated_at
before update on public.estoque_itens
for each row execute function public.set_updated_at();

create table public.emprestimos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.estoque_itens (id) on delete cascade,
  integrante_id uuid not null references public.profiles (id) on delete cascade,
  projeto_nome text,
  quantidade int not null check (quantidade > 0),
  data date not null default current_date,
  encerrado_em timestamptz,
  created_at timestamptz not null default now()
);

create table public.devolucoes (
  id uuid primary key default gen_random_uuid(),
  emprestimo_id uuid not null references public.emprestimos (id) on delete cascade,
  quantidade int not null check (quantidade > 0),
  data date not null default current_date,
  created_at timestamptz not null default now()
);

-- devolução não pode exceder o saldo; devolução total encerra o empréstimo
create or replace function public.aplica_devolucao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_emprestado int;
  total_devolvido int;
begin
  select e.quantidade into total_emprestado
  from public.emprestimos e where e.id = new.emprestimo_id for update;

  select coalesce(sum(d.quantidade), 0) into total_devolvido
  from public.devolucoes d where d.emprestimo_id = new.emprestimo_id and d.id <> new.id;

  if total_devolvido + new.quantidade > total_emprestado then
    raise exception 'devolução maior que o saldo do empréstimo';
  end if;

  if total_devolvido + new.quantidade = total_emprestado then
    update public.emprestimos set encerrado_em = now() where id = new.emprestimo_id;
  end if;

  return new;
end;
$$;

create trigger devolucoes_aplica
before insert on public.devolucoes
for each row execute function public.aplica_devolucao();

-- ---------- Biblioteca ----------

create table public.receitas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null check (categoria in ('amigurumi', 'granny', 'faixa', 'manta')),
  sub text,
  resumo text,
  specs jsonb not null default '[]', -- [["Agulha","4 mm"], ...]
  conteudo jsonb not null default '{}', -- rings/seq/paleta/esquema conforme categoria
  pdf_path text, -- objeto no bucket 'receitas'; selo PDF só se preenchido
  origem text not null default 'manual' check (origem in ('manual', 'criador')),
  criado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger receitas_updated_at
before update on public.receitas
for each row execute function public.set_updated_at();

-- bucket privado para os PDFs das receitas
insert into storage.buckets (id, name, public)
values ('receitas', 'receitas', false)
on conflict (id) do nothing;

create policy receitas_storage_read on storage.objects
  for select to authenticated using (bucket_id = 'receitas');
create policy receitas_storage_upload on storage.objects
  for insert to authenticated with check (bucket_id = 'receitas');
create policy receitas_storage_delete on storage.objects
  for delete to authenticated using (bucket_id = 'receitas' and public.is_admin());

-- ---------- Roles ----------

alter table public.estoque_itens enable row level security;
alter table public.emprestimos enable row level security;
alter table public.devolucoes enable row level security;
alter table public.receitas enable row level security;

create policy estoque_select on public.estoque_itens
  for select to authenticated using (true);
create policy emprestimos_select on public.emprestimos
  for select to authenticated using (true);
create policy devolucoes_select on public.devolucoes
  for select to authenticated using (true);
create policy receitas_select on public.receitas
  for select to authenticated using (true);

-- estoque: escrita só admin
create policy estoque_write_admin on public.estoque_itens
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- empréstimos e devoluções: quem tem a permissão 'devolucoes' (admin sempre)
create policy emprestimos_insert on public.emprestimos
  for insert to authenticated with check (public.has_perm('devolucoes'));
create policy emprestimos_update on public.emprestimos
  for update to authenticated using (public.has_perm('devolucoes')) with check (public.has_perm('devolucoes'));
create policy emprestimos_delete_admin on public.emprestimos
  for delete to authenticated using (public.is_admin());

create policy devolucoes_insert on public.devolucoes
  for insert to authenticated with check (public.has_perm('devolucoes'));
create policy devolucoes_delete_admin on public.devolucoes
  for delete to authenticated using (public.is_admin());

-- receitas: qualquer autenticada cria a própria; edita/apaga autora ou admin
create policy receitas_insert on public.receitas
  for insert to authenticated with check (criado_por = auth.uid());
create policy receitas_update on public.receitas
  for update to authenticated
  using (criado_por = auth.uid() or public.is_admin())
  with check (criado_por = auth.uid() or public.is_admin());
create policy receitas_delete on public.receitas
  for delete to authenticated using (criado_por = auth.uid() or public.is_admin());
