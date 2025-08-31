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
        .insert({ user_id: user.id, title: message.substring(0, 30) })
        .select('id')
        .single();
      if (conversationError) throw conversationError;
      currentConversationId = newConversation.id;
    }

    // Save user message
    await supabaseClient.from('messages').insert({
      conversation_id: currentConversationId,
      user_id: user.id,
      role: 'user',
      content: message,
    });

    // Fetch conversation history
    const { data: messages } = await supabaseClient
      .from('messages')
      .select('role, content')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true });

    const systemPrompt = `You are NewMe, an emotionally intelligent AI companion dedicated to supporting women on their journey of self-discovery and personal growth.`;

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
        total_messages: (messages?.length || 0) + 2,
      })
      .eq('id', currentConversationId);

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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});