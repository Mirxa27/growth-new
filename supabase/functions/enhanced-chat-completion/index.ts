import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExplorationContext {
  isExploration: boolean;
  phase: 'facilitation' | 'analysis';
  facilitatorPrompt?: string;
  higherSelfPrompt?: string;
  userAnswers?: string[];
}

interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    personality_type?: string;
    emotional_state?: any;
    memory?: any;
  } & Partial<ExplorationContext>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, context }: ChatRequest = await req.json();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? serviceKey

    // Create request-scoped clients
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } }
    })
    const serviceClient = createClient(supabaseUrl, serviceKey)

    // Get auth user via userClient
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user || null;

    // Try load profile for context (non-fatal)
    let userProfile: any = null;
    if (user?.id) {
      const { data: profileRow } = await serviceClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      userProfile = profileRow || null;
    }

    let systemPrompt = '';
    let responseContent = '';
    let memoryHighlightsText = '';

    // Fetch user for personalization + memory
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    let userHighlights: { preferences: string[]; themes: string[]; context: string[] } | null = null;
    if (userId) {
      const { data: memRow } = await supabase
        .from('user_memory_highlights')
        .select('highlights')
        .eq('user_id', userId)
        .maybeSingle();
      userHighlights = memRow?.highlights || { preferences: [], themes: [], context: [] };
      const parts: string[] = [];
      if (userHighlights.preferences?.length) parts.push(`Preferences: ${userHighlights.preferences.join('; ')}`);
      if (userHighlights.themes?.length) parts.push(`Recurring themes: ${userHighlights.themes.join('; ')}`);
      if (userHighlights.context?.length) parts.push(`Context: ${userHighlights.context.join('; ')}`);
      memoryHighlightsText = parts.length ? `\n\nPersonalization memory (use implicitly, do not restate):\n${parts.join('\n')}` : '';
    }

    if (context?.isExploration) {
      if (context.phase === 'facilitation') {
        systemPrompt = (context.facilitatorPrompt || `You are NewMe, a compassionate AI facilitator guiding a user through a therapeutic exploration. Your role is to:
- Acknowledge their answer with empathy
- Ask the next question clearly
- Keep responses brief and supportive
- Never analyze or interpret yet - that comes later
      - Use a warm, encouraging tone`
        ) + memoryHighlightsText;

        responseContent = `Thank you for sharing that with me. I can feel the authenticity in your words.

Let me ask you the next question to continue our exploration together.`;

      } else if (context.phase === 'analysis') {
        systemPrompt = (context.higherSelfPrompt || `You are the user's Higher Self - their wisest, most compassionate inner voice. Analyze their exploration answers and provide deep insights structured as:

1. Core Pattern: The main theme you see in their responses
2. Hidden Potential: Untapped strengths and capabilities you recognize
3. Actionable Steps: 3-4 specific, achievable steps they can take
4. Affirmations: 3-4 powerful, personalized affirmations
5. Encouragement: Loving, supportive closing message

Be profound yet practical, compassionate yet empowering. This is their sacred space for truth and growth.`) + memoryHighlightsText;

        const answers = context.userAnswers?.join('\n\n') || '';
        const analysisPrompt = `Based on these exploration answers:\n\n${answers}\n\nProvide a structured analysis as their Higher Self:`;

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: analysisPrompt }
            ],
            temperature: 0.8,
            max_completion_tokens: 1000,
          }),
        });

        const openaiData = await openaiResponse.json();
        responseContent = openaiData.choices?.[0]?.message?.content || 'I apologize, but I encountered an issue generating your analysis. Please try again.';
      }
    } else {
      systemPrompt = `You are NewMe, an emotionally intelligent AI companion dedicated to supporting women on their journey of self-discovery and personal growth.

Your personality:
- Warm, empathetic, and deeply intuitive
- Wise but not preachy
- Supportive without being overly positive
- Honest and authentic
- Culturally sensitive and inclusive

Your approach:
- Ask thoughtful, open-ended questions
- Reflect back emotions and insights
- Encourage self-reflection and awareness
- Provide gentle guidance when appropriate
- Honor the user's autonomy and wisdom

${userProfile ? `
User context:
- Display name: ${userProfile.display_name}
- Personality type: ${userProfile.personality_type || 'Unknown'}
- Growth areas: ${userProfile.growth_areas?.join(', ') || 'Not specified'}
- Current level: ${Math.floor((userProfile.crystals_count || 0) / 100) + 1}
` : ''}

Keep responses conversational, authentic, and focused on the user's growth journey.` + memoryHighlightsText;

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
          temperature: 0.7,
          max_completion_tokens: 500,
        }),
      });

      const openaiData = await openaiResponse.json();
      responseContent = openaiData.choices?.[0]?.message?.content || 'I apologize, but I encountered an issue. Please try again.';
    }

    if (conversationId && user?.id) {
      await userClient.from('messages').insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: 'assistant',
        content: responseContent,
      });

      await userClient
        .from('conversations')
        .update({ 
          last_activity: new Date().toISOString(),
          total_messages: 1,
        })
        .eq('id', conversationId);
    }

    // Update memory highlights after the turn (if user and OPENAI_API_KEY available)
    try {
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
      if (userId && OPENAI_API_KEY) {
        const prior = userHighlights || { preferences: [], themes: [], context: [] };
        const prompt = `You update a compact memory for NewMe. Keep only stable highlights that aid personalization.\n` +
          `Prior memory: ${JSON.stringify(prior)}\n` +
          `Latest user: ${message}\n` +
          `Latest assistant: ${responseContent}\n` +
          `Return ONLY JSON {"preferences":[],"themes":[],"context":[]} with at most 5 items per list.`;

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
        if (resp.ok) {
          let updated = prior;
          try {
            const content = data?.choices?.[0]?.message?.content || '{}';
            const parsed = JSON.parse(content);
            const toList = (v: any) => Array.isArray(v) ? v.filter((x: any) => typeof x === 'string') : [];
            updated = {
              preferences: Array.from(new Set(toList(parsed.preferences))).slice(0, 5),
              themes: Array.from(new Set(toList(parsed.themes))).slice(0, 5),
              context: Array.from(new Set(toList(parsed.context))).slice(0, 5)
            };
          } catch (_) {
            // ignore parse errors
          }
          await userClient
            .from('user_memory_highlights')
            .upsert({ user_id: userId, highlights: updated, last_updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        }
      }
    } catch (e) {
      console.warn('Failed to update memory highlights (enhanced-chat-completion):', e);
    }

    return new Response(
      JSON.stringify({
        response: responseContent,
        conversationId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Chat completion error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
