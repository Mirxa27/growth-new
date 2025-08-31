/// <reference types="https://esm.sh/v135/@deno/types@0.1.43/index.d.ts" />
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
  const auth = req.headers.get('Authorization')
  if (!auth) return { user: null, error: 'Authorization header required' }
  const token = auth.replace('Bearer ', '')
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return { user: null, error: 'Invalid authentication' }
  return { user: data.user, error: null }
}

async function exportUserData(userId: string) {
  // Fetch a curated set of user-related data
  const [profile, assessments, messages, posts, sessions] = await Promise.all([
    supabase.from('profiles' as any).select('*').eq('id', userId).single(),
    supabase.from('assessment_results' as any).select('*').eq('user_id', userId).limit(2000),
    supabase.from('messages' as any).select('*').eq('user_id', userId).limit(5000),
    supabase.from('community_posts' as any).select('*').eq('user_id', userId).limit(2000),
    supabase.from('exploration_sessions' as any).select('*').eq('user_id', userId).limit(2000),
  ])

  const dataset = {
    exported_at: new Date().toISOString(),
    user_id: userId,
    profile: profile.data ?? null,
    assessment_results: assessments.data ?? [],
    messages: messages.data ?? [],
    community_posts: posts.data ?? [],
    exploration_sessions: sessions.data ?? [],
  }

  return dataset
}

async function deleteAccount(userId: string) {
  // Best-effort cleanup; actual auth deletion via admin API
  // Delete or anonymize PII in app tables first
  const tasks: Promise<any>[] = []
  tasks.push(
    supabase.from('profiles' as any).update({ display_name: 'Deleted User', bio: null, avatar_url: null }).eq('id', userId)
  )
  tasks.push(supabase.from('messages' as any).update({ content: '[deleted]' }).eq('user_id', userId))
  tasks.push(supabase.from('community_posts' as any).update({ content: '[deleted]' }).eq('user_id', userId))

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
      const confirm = body?.confirm === true
      if (!confirm) {
        return new Response(JSON.stringify({ error: 'Confirmation required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      await deleteAccount(user.id)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('account-management error:', e)
    return new Response(JSON.stringify({ error: e?.message ?? 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})