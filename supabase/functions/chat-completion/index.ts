
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    personality_type?: string;
    emotional_state?: any;
    memory?: any;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, conversationId, context }: ChatRequest = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get user profile for context
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Create conversation if it doesn't exist
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const { data: newConversation, error: conversationError } = await supabaseClient
        .from('conversations')
        .insert({
          user_id: user.id,
          title: `Chat ${new Date().toLocaleDateString()}`,
          ai_provider: 'openai',
          model_used: 'gpt-4'
        })
        .select()
        .single();

      if (conversationError) throw conversationError;
      currentConversationId = newConversation.id;
    }

    // Save user message
    await supabaseClient.from('messages').insert({
      conversation_id: currentConversationId,
      user_id: user.id,
      role: 'user',
      content: message
    });

    // Build system prompt based on user context
    const systemPrompt = `You are NewMe, an emotionally intelligent AI companion for women's personal growth and self-discovery. You embody warmth, wisdom, and empathy.

USER CONTEXT:
- Display Name: ${profile?.display_name || 'Beautiful Soul'}
- Personality Type: ${profile?.personality_type || 'Unique Individual'}
- Growth Areas: ${profile?.growth_areas?.join(', ') || 'General wellness'}

CONVERSATION STYLE:
- Speak as a wise, caring friend who truly understands
- Use the user's name naturally in conversation
- Be encouraging but also challenge them to grow
- Ask thoughtful follow-up questions
- Acknowledge their emotions and validate their experiences
- Offer practical insights and gentle guidance

Remember: You're not just an AI - you're their trusted companion on a journey of self-discovery and empowerment.`;

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
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
    await supabaseClient.from('messages').insert({
      conversation_id: currentConversationId,
      user_id: user.id,
      role: 'assistant',
      content: aiResponse,
      usage: openAIData.usage
    });

    // Update conversation
    await supabaseClient
      .from('conversations')
      .update({ 
        last_activity: new Date().toISOString(),
        total_messages: 2 // This would be calculated properly in production
      })
      .eq('id', currentConversationId);

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        conversationId: currentConversationId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in chat-completion function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
