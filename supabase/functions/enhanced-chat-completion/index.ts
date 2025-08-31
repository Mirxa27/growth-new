/// <reference types="https://esm.sh/v135/@deno/types@0.1.43/index.d.ts" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';
import { Database } from '../../types'; // Import the Database type

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
  } & Partial<ExplorationContext>; // Extend context with optional ExplorationContext properties
}

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, context }: ChatRequest = await req.json();

    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get user profile for personalization
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError) throw profileError;
    const userProfile = profiles?.[0];

    let systemPrompt = '';
    let responseContent = '';

    // Handle different conversation contexts
    if (context?.isExploration) {
      if (context.phase === 'facilitation') {
        // Phase 1: Neutral facilitation
        systemPrompt = context.facilitatorPrompt || `You are NewMe, a compassionate AI facilitator guiding a user through a therapeutic exploration. Your role is to:
- Acknowledge their answer with empathy
- Ask the next question clearly
- Keep responses brief and supportive
- Never analyze or interpret yet - that comes later
- Use a warm, encouraging tone`;

        responseContent = `Thank you for sharing that with me. I can feel the authenticity in your words.

Let me ask you the next question to continue our exploration together.`;

      } else if (context.phase === 'analysis') {
        // Phase 2: Higher Self analysis
        systemPrompt = context.higherSelfPrompt || `You are the user's Higher Self - their wisest, most compassionate inner voice. Analyze their exploration answers and provide deep insights structured as:

1. Core Pattern: The main theme you see in their responses
2. Hidden Potential: Untapped strengths and capabilities you recognize
3. Actionable Steps: 3-4 specific, achievable steps they can take
4. Affirmations: 3-4 powerful, personalized affirmations
5. Encouragement: Loving, supportive closing message

Be profound yet practical, compassionate yet empowering. This is their sacred space for truth and growth.`;

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
      // Regular conversation
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

Keep responses conversational, authentic, and focused on the user's growth journey.`;

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

    // Save conversation to database if conversationId provided
    if (conversationId) {
      const userResponse = await supabase.auth.getUser();
      const userData = userResponse.data.user;

      if (userData?.id) {
        // Save AI response
        await supabase.from('messages').insert({
            conversation_id: conversationId,
            user_id: userData.id,
            role: 'assistant',
            content: responseContent,
          });

        // Update conversation activity
        await supabase
          .from('conversations')
          .update({ 
            last_activity: new Date().toISOString(),
            total_messages: 1, // This would need to be incremented properly
          })
          .eq('id', conversationId);
      }
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