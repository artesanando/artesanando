-- Quem recebe o link de acesso entra com uma senha que a administradora
-- conhece. Dizer "dá para trocar em Meu perfil" numa linha de texto não
-- funcionava: ninguém ia. A troca vira parada obrigatória no primeiro acesso,
-- e para isso o app precisa saber que a senha ainda é a provisória.
--
-- A marca fica em profiles, não no metadata do Auth, porque é o perfil que já
-- circula pelo app inteiro — o modal lê de `useAuth().profile` sem ida extra
-- ao servidor.

alter table public.profiles
  add column if not exists senha_provisoria boolean not null default false;

comment on column public.profiles.senha_provisoria is
  'true entre a administradora gerar o acesso e a integrante escolher a senha dela';

-- O guard de update (20260820120000) não lista esta coluna, então a própria
-- dona pode desmarcá-la — que é exatamente o que o modal faz ao salvar. A
-- policy profiles_update já limita a linha à dona ou a uma administradora.
