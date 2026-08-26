// Edge Function: cria o acesso de uma integrante e devolve o link (só admin).
// Usa a service role no servidor; o front chama via supabase.functions.invoke.
// Deploy: supabase functions deploy invite-member
import { createClient } from 'npm:@supabase/supabase-js@2'

/* O Auth exige um email por conta. Como o projeto não manda mensagem nenhuma,
   ele é só um identificador interno num domínio que não existe. Ninguém digita
   nem vê isto: o convite viaja pelo link, na mão. */
const identificador = (usuario: string) => `${usuario.toLowerCase()}@artesanando.local`

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
      return json({ error: 'Só administradoras podem convidar.' }, 403)
    }

    const { nome, usuario, telefone, preferencia, turno, papel, redirectTo, profileId } =
      await req.json()
    if (!nome || !usuario) {
      return json({ error: 'Informe o nome e o usuário.' }, 400)
    }

    /* Convite de quem já entrou pela chamada: o perfil existe e o que falta é a
       conta. O id vai no metadata para o trigger ligar exatamente nele, em vez
       de tentar adivinhar pelo usuário e acabar criando ficha duplicada. */
    if (profileId) {
      const { data: alvo } = await admin
        .from('profiles')
        .select('id, user_id')
        .eq('id', profileId)
        .maybeSingle()
      if (!alvo) return json({ error: 'Integrante não encontrada.' }, 404)
      if (alvo.user_id) return json({ error: `${nome} já tem conta no app.` }, 409)
    }

    const { data: existing } = await admin
      .from('profiles')
      .select('id')
      .eq('usuario', usuario)
      .maybeSingle()
    if (existing && existing.id !== profileId) {
      return json({ error: 'Já existe uma integrante com esse usuário.' }, 409)
    }

    const metadata = {
      nome,
      usuario,
      telefone: telefone ?? null,
      preferencia: preferencia ?? 'ambos',
      turno: turno ?? 'ambos',
      papel: papel === 'admin' ? 'admin' : 'integrante',
      perfil_id: profileId ?? null,
    }

    /* `generateLink` cria a conta e devolve o link sem mandar mensagem nenhuma
       — é o convite inteiro. A admin copia e manda pelo WhatsApp. */
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'invite',
      email: identificador(usuario),
      options: { data: metadata, redirectTo },
    })
    if (error) {
      console.error('generateLink', error)
      return json({ error: 'Não foi possível criar o convite. Tente de novo.' }, 400)
    }

    return json({
      ok: true,
      userId: data.user?.id,
      link: data.properties?.action_link ?? null,
    })
  } catch (e) {
    console.error(e)
    return json({ error: 'Não foi possível concluir. Tente de novo.' }, 500)
  }
})
