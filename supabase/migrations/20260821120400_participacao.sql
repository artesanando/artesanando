-- Quem participou de cada semestre.
--
-- `profiles.ativo` é global: desativar alguém a apagaria também dos relatórios
-- de semestres passados. A participação num semestre se deduz de quem apareceu
-- em ao menos uma chamada dele — o dado já existe, faltava a leitura.
--
-- Herda o RLS de `presencas` e `encontros`, ambas de leitura para autenticadas.

create view public.participacao_semestre as
  select distinct e.semestre_id, p.integrante_id
    from public.presencas p
    join public.encontros e on e.id = p.encontro_id
   where p.presente and e.semestre_id is not null;
