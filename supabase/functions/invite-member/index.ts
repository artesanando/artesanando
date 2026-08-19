// Edge Function: convida uma integrante por email (só admin).
// Usa a service role no servidor; o front chama via supabase.functions.invoke.
// Deploy: supabase functions deploy invite-member
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
    if (!user) return json({ error: 'não autenticada' }, 401)

    const admin = createClient(supabaseUrl, serviceRole)
    const { data: profile } = await admin
      .from('profiles')
      .select('papel, ativo')
      .eq('id', user.id)
      .single()
    if (!profile || profile.papel !== 'admin' || !profile.ativo) {
      return json({ error: 'apenas administradoras convidam integrantes' }, 403)
    }

    const { email, nome, usuario, telefone, preferencia, papel, redirectTo } = await req.json()
    if (!email || !nome || !usuario) {
      return json({ error: 'email, nome e usuario são obrigatórios' }, 400)
    }

    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('usuario', usuario)
      .maybeSingle()
    if (existing) return json({ error: 'já existe uma integrante com esse usuário' }, 409)

    const metadata = {
      nome,
      usuario,
      telefone: telefone ?? null,
      preferencia: preferencia ?? 'ambos',
      papel: papel === 'admin' ? 'admin' : 'integrante',
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: metadata,
      redirectTo,
    })
    if (error) return json({ error: error.message }, 400)

    // O email depende do SMTP estar configurado; o link vai junto na resposta
    // para a admin poder mandar pelo WhatsApp quando o email não sair.
    let link: string | null = null
    const gerado = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: { data: metadata, redirectTo },
    })
    if (!gerado.error) link = gerado.data.properties?.action_link ?? null

    return json({ ok: true, userId: data.user?.id, link })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'erro inesperado' }, 500)
  }
})
