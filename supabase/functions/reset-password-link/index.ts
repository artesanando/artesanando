// Edge Function: gera um link de nova senha para uma integrante que já tem
// conta (só admin). Mesmo motivo do invite-member: nada sai por email, o link
// vem na resposta para a admin mandar na mão.
// Deploy: supabase functions deploy reset-password-link
import { createClient } from 'npm:@supabase/supabase-js@2'

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
      return json({ error: 'Só administradoras podem gerar o link.' }, 403)
    }

    const { profileId, redirectTo } = await req.json()
    if (!profileId) return json({ error: 'Escolha a integrante.' }, 400)

    // De quem é o link sai do perfil, nunca do corpo da requisição — senão
    // qualquer conta autenticada poderia pedir o link de outra pessoa.
    const { data: target } = await admin
      .from('profiles')
      .select('user_id, nome')
      .eq('id', profileId)
      .maybeSingle()
    if (!target) return json({ error: 'Integrante não encontrada.' }, 404)
    if (!target.user_id) {
      return json({ error: `${target.nome} ainda não tem conta. Use "Convidar para o app".` }, 400)
    }

    /* O `generateLink` só aceita a conta pelo identificador interno do Auth, e
       ele não fica mais espelhado em profiles — vem do próprio Auth. */
    const { data: conta } = await admin.auth.admin.getUserById(target.user_id)
    if (!conta.user?.email)
      return json({ error: 'Não foi possível gerar o link para essa conta.' }, 400)

    const gerado = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: conta.user.email,
      options: { redirectTo },
    })
    if (gerado.error) {
      console.error('generateLink', gerado.error)
      return json({ error: 'Não foi possível gerar o link. Tente de novo.' }, 400)
    }

    return json({ ok: true, link: gerado.data.properties?.action_link ?? null })
  } catch (e) {
    console.error(e)
    return json({ error: 'Não foi possível concluir. Tente de novo.' }, 500)
  }
})
