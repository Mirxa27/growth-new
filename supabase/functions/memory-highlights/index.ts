/* eslint-disable @typescript-eslint/no-explicit-any */
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';
import { corsHeaders } from '../_shared/cors.ts';

type Highlights = {
  preferences: string[];
  themes: string[];
  context: string[];
}

type RequestBody = {
  action?: 'get' | 'upsert' | 'update_from_turn';
  highlights?: Highlights;
  user_message?: string;
  assistant_message?: string;
}

const DEFAULT_HIGHLIGHTS: Highlights = {
  preferences: [],
  themes: [],
  context: []
};

function sanitizeHighlights(h: any): Highlights {
  const toList = (v: any) => Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 8) : [];
  return {
    preferences: toList(h?.preferences),
    themes: toList(h?.themes),
    context: toList(h?.context)
  };
}

function composePrompt(prev: Highlights, user: string, assistant: string) {
  return `You update a compact memory for a personal AI assistant named NewMe.
Only keep stable, high-signal highlights that improve personalization over time.

Rules:
- Three lists only: preferences, themes, context.
- preferences: critical user likes/dislikes, modalities, tone/pace preferences.
- themes: recurring topics, goals, challenges, identities.
- context: important facts that remain relevant across sessions (e.g., time constraints, routines, constraints).
- Always deduplicate, be concise (max 5 per list), no PII extraction beyond what the user explicitly provided.
- If no change, keep prior items.

Prior memory (JSON):\n${JSON.stringify(prev)}

Latest turn:
- user: ${user}
- assistant: ${assistant}

Return ONLY strict JSON of shape {"preferences": string[], "themes": string[], "context": string[]} with at most 5 strings each, no extra fields.`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    // Validate user
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    const user = userData?.user;
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body: RequestBody = req.method === 'POST' ? await req.json() : { action: 'get' };
    const action = body.action || (req.method === 'GET' ? 'get' : 'get');

    if (action === 'get') {
      const { data: row } = await userClient
        .from('user_memory_highlights')
        .select('highlights')
        .eq('user_id', user.id)
        .maybeSingle();

      const highlights = sanitizeHighlights(row?.highlights ?? DEFAULT_HIGHLIGHTS);
      return new Response(JSON.stringify({ highlights }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'upsert') {
      const incoming = sanitizeHighlights(body.highlights ?? DEFAULT_HIGHLIGHTS);
      const { error } = await userClient
        .from('user_memory_highlights')
        .upsert({ user_id: user.id, highlights: incoming, last_updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, highlights: incoming }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update_from_turn') {
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (!OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const userText = String(body.user_message ?? '').trim();
      const assistantText = String(body.assistant_message ?? '').trim();
      if (!userText || !assistantText) {
        return new Response(JSON.stringify({ error: 'user_message and assistant_message required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: row } = await userClient
        .from('user_memory_highlights')
        .select('highlights')
        .eq('user_id', user.id)
        .maybeSingle();

      const prior = sanitizeHighlights(row?.highlights ?? DEFAULT_HIGHLIGHTS);
      const prompt = composePrompt(prior, userText, assistantText);

      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          temperature: 0.2,
          messages: [
            { role: 'system', content: 'You produce ONLY compact JSON as instructed. No prose.' },
            { role: 'user', content: prompt }
          ]
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        console.error('OpenAI error (memory-highlights):', data);
        return new Response(JSON.stringify({ error: 'OpenAI error', details: data }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      let updated: Highlights = prior;
      try {
        const content = data?.choices?.[0]?.message?.content || '{}';
        updated = sanitizeHighlights(JSON.parse(content));
        // enforce max 5 per list
        updated = {
          preferences: Array.from(new Set(updated.preferences)).slice(0, 5),
          themes: Array.from(new Set(updated.themes)).slice(0, 5),
          context: Array.from(new Set(updated.context)).slice(0, 5)
        };
      } catch (e) {
        // fallback: keep prior
        console.warn('Failed to parse memory-highlights JSON, keeping prior', e);
      }

      const { error } = await userClient
        .from('user_memory_highlights')
        .upsert({ user_id: user.id, highlights: updated, last_updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) throw error;

      return new Response(JSON.stringify({ ok: true, highlights: updated }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('memory-highlights error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

