-- Semestre inicial (necessário para vincular projetos). Ajuste as datas conforme o calendário real.

insert into public.semestres (label, inicio, fim, ativo)
values ('2026.2', '2026-07-01', '2026-12-15', true)
on conflict (label) do nothing;
