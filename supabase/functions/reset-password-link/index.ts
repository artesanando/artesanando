// Edge Function: gera uma senha provisória para quem já tem conta (só admin).
// Mesmo motivo do invite-member: nada sai por email, e link de uso único não
// sobrevive ao preview do WhatsApp — a senha vem na resposta, para a admin
// mandar na mão. O nome da function ficou do tempo do link.
// Deploy: supabase functions deploy reset-password-link
import { createClient } from 'npm:@supabase/supabase-js@2'

/* Sem i, l, o, 0 e 1: a senha é ditada no WhatsApp e copiada à mão. */
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789'

function senhaProvisoria() {
  const n = new Uint32Array(10)
  crypto.getRandomValues(n)
  return Array.from(n, (x) => ALFABETO[x % ALFABETO.length]).join('')
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Identifica quem chamou a partir do JWT do request
    const authHeader = req.headers.get('Authorization') ?? ''
    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
    } = await caller.auth.getUser()
    if (!user) return json({ error: 'Sua sessão expirou. Entre de novo.' }, 401)

    const admin = createClient(supabaseUrl, serviceRole)
    // `profiles.id` deixou de ser o id do auth na migration 130000 — quem
    // identifica a chamadora agora é `user_id`.
    const { data: profile } = await admin
      .from('profiles')
      .select('papel, ativo')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!profile || profile.papel !== 'admin' || !profile.ativo) {
      return json({ error: 'Só administradoras podem gerar a senha.' }, 403)
    }

    const { profileId } = await req.json()
    if (!profileId) return json({ error: 'Escolha a integrante.' }, 400)

    // De quem é a senha sai do perfil, nunca do corpo da requisição — senão
    // qualquer conta autenticada poderia pedir a senha de outra pessoa.
    const { data: target } = await admin
      .from('profiles')
      .select('user_id, nome, usuario')
      .eq('id', profileId)
      .maybeSingle()
    if (!target) return json({ error: 'Integrante não encontrada.' }, 404)
    if (!target.user_id) {
      return json({ error: `${target.nome} ainda não tem conta. Use "Convidar para o app".` }, 400)
    }

    const senha = senhaProvisoria()
    const { error } = await admin.auth.admin.updateUserById(target.user_id, { password: senha })
    if (error) {
      console.error('updateUserById', error)
      return json({ error: 'Não foi possível gerar a senha. Tente de novo.' }, 400)
    }

    await admin.from('profiles').update({ senha_provisoria: true }).eq('id', profileId)

    return json({ ok: true, usuario: target.usuario, senha })
  } catch (e) {
    console.error(e)
    return json({ error: 'Não foi possível concluir. Tente de novo.' }, 500)
  }
})
