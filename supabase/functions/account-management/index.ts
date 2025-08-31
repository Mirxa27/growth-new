import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const supabase = createClient(
   Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

type Action = 'export' | 'delete'

async function getUserFromAuthHeader(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { user: null, error: 'No authorization header' }
  }
  const token = authHeader.replace('Bearer ', '')
  const { data, error } = await supabase.auth.getUser(token)
  if (error) {
    return { user: null, error: error.message }
  }
  return { user: data.user, error: null }
}

async function exportUserData(userId: string) {
  // Fetch a curated set of user-related data
  const [profile, assessments, messages, posts, sessions] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('assessment_results').select('*').eq('user_id', userId).limit(2000),
    supabase.from('messages').select('*').eq('user_id', userId).limit(5000),
    supabase.from('community_posts').select('*').eq('user_id', userId).limit(2000),
    supabase.from('exploration_sessions').select('*').eq('user_id', userId).limit(2000),
  ])

  const dataset = {
    exported_at: new Date().toISOString(),
    user_id: userId,
    profile: profile.data ?? null,
    assessments: assessments.data ?? [],
    messages: messages.data ?? [],
    posts: posts.data ?? [],
    sessions: sessions.data ?? [],
  }

  return dataset
}

async function deleteAccount(userId: string) {
  const tasks = []
  tasks.push(supabase.from('profiles').delete().eq('id', userId))
  tasks.push(supabase.from('assessment_results').delete().eq('user_id', userId))
  tasks.push(supabase.from('messages').delete().eq('user_id', userId))
  tasks.push(supabase.from('exploration_sessions').delete().eq('user_id', userId))
  tasks.push(supabase.from('community_posts').update({ content: '[deleted]' }).eq('user_id', userId))

  await Promise.all(tasks)

  // Delete the user account
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw error

  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const { user, error } = await getUserFromAuthHeader(req)
    if (error || !user) {
      return new Response(JSON.stringify({ error }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const action: Action = body?.action

    if (action === 'export') {
      const data = await exportUserData(user.id)
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'delete') {
      if (!body.confirm) {
        return new Response(JSON.stringify({ error: 'Confirmation required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      await deleteAccount(user.id)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})