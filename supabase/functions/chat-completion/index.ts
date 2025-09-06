import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  conversationId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId }: ChatRequest = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User not found');

    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const { data: newConversation, error: conversationError } = await supabaseClient
        .from('conversations')
        .insert([{ user_id: user.id, title: message.substring(0, 30) }])
        .select('id')
        .single();
      if (conversationError) throw conversationError;
      currentConversationId = newConversation.id;
    }

    // Save user message
    await supabaseClient.from('messages').insert([{
      conversation_id: currentConversationId,
      user_id: user.id,
      role: 'user',
      content: message,
    }]);

    // Fetch conversation history
    const { data: messages } = await supabaseClient
      .from('messages')
      .select('role, content')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true });

    // Fetch compact memory highlights for personalization
    let memoryText = '';
    try {
      const { data: memRow } = await supabaseClient
        .from('user_memory_highlights')
        .select('highlights')
        .eq('user_id', user.id)
        .maybeSingle();
      const h = memRow?.highlights || { preferences: [], themes: [], context: [] };
      const parts: string[] = [];
      if (h.preferences?.length) parts.push(`Preferences: ${h.preferences.join('; ')}`);
      if (h.themes?.length) parts.push(`Recurring themes: ${h.themes.join('; ')}`);
      if (h.context?.length) parts.push(`Context: ${h.context.join('; ')}`);
      memoryText = parts.length ? `\n\nPersonalization memory (use implicitly, do not restate):\n${parts.join('\n')}` : '';
    } catch (_) {}

    const systemPrompt = `You are NewMe, an emotionally intelligent AI companion dedicated to supporting women on their journey of self-discovery and personal growth.` + memoryText;

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.8,
        max_tokens: 500
      }),
    });

    const openAIData = await openAIResponse.json();
    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = openAIData.choices[0]?.message?.content || 'I apologize, but I had trouble processing your message. Could you please try again?';

    // Save AI response
    await supabaseClient.from('messages').insert([{
      conversation_id: currentConversationId,
      user_id: user.id,
      role: 'assistant',
      content: aiResponse,
      usage: openAIData.usage
    }]);

    // Update conversation
    await supabaseClient
      .from('conversations')
      .update({
        last_activity: new Date().toISOString(),
        total_messages: (messages?.length || 0) + 2,
      })
      .eq('id', currentConversationId);

    // Update memory highlights after the turn
    try {
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (OPENAI_API_KEY) {
        const prior = (await supabaseClient
          .from('user_memory_highlights')
          .select('highlights')
          .eq('user_id', user.id)
          .maybeSingle())?.data?.highlights || { preferences: [], themes: [], context: [] };

        const prompt = `You update a compact memory for NewMe. Keep only stable highlights that aid personalization.\n` +
          `Prior memory: ${JSON.stringify(prior)}\n` +
          `Latest user: ${message}\n` +
          `Latest assistant: ${aiResponse}\n` +
          `Return ONLY JSON {"preferences":[],"themes":[],"context":[]} with at most 5 items per list.`;

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
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
        if (resp.ok) {
          try {
            const content = data?.choices?.[0]?.message?.content || '{}';
            const parsed = JSON.parse(content);
            const toList = (v: any) => Array.isArray(v) ? v.filter((x: any) => typeof x === 'string') : [];
            const updated = {
              preferences: Array.from(new Set(toList(parsed.preferences))).slice(0, 5),
              themes: Array.from(new Set(toList(parsed.themes))).slice(0, 5),
              context: Array.from(new Set(toList(parsed.context))).slice(0, 5)
            };
            await supabaseClient
              .from('user_memory_highlights')
              .upsert({ user_id: user.id, highlights: updated, last_updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn('Failed to update memory highlights (chat-completion):', e);
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        conversationId: currentConversationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
