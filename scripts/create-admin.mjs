// Cria a primeira usuária admin no Supabase Auth (o trigger preenche profiles/permissoes).
// As demais integrantes devem ser convidadas depois pela Edge Function invite-member.
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.')
  process.exit(1)
}

const email = process.env.ADMIN_EMAIL
const senha = process.env.ADMIN_PASSWORD
const nome = process.env.ADMIN_NOME
const usuario = process.env.ADMIN_USUARIO
if (!email || !senha || !nome || !usuario) {
  console.error('Defina ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOME e ADMIN_USUARIO no ambiente.')
  process.exit(1)
}

const supabase = createClient(url, key)

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password: senha,
  email_confirm: true,
  user_metadata: {
    nome,
    usuario,
    papel: 'admin',
    preferencia: process.env.ADMIN_PREFERENCIA ?? 'ambos',
    telefone: process.env.ADMIN_TELEFONE ?? null,
  },
})

if (error) {
  console.error(`✗ ${usuario}: ${error.message}`)
  process.exit(1)
}

console.log(`✓ ${usuario} (${email}) · id ${data.user.id}`)
