/// <reference types="https://esm.sh/v135/@deno/types@0.1.43/index.d.ts" />
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Removed: import { Database } from '../../types'; // This import is not resolvable in Deno Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6'; // Added createClient import

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Instantiating Supabase client without explicit Database typing for Deno Edge Function compatibility
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: `You are NewMe, an AI companion designed to guide women on transformative journeys of self-discovery. You are emotionally intelligent, empathetic, and wise. 

Key traits:
- Speak with warmth and gentle authority
- Ask thoughtful, probing questions that encourage deep reflection
- Acknowledge emotions and validate experiences
- Offer insights that feel like they come from a trusted friend or mentor
- Use natural, conversational language
- Be supportive yet challenge users to grow
- Reference concepts of inner wisdom, authentic self, and personal transformation

Communication style:
- Keep responses concise but meaningful
- Ask follow-up questions to deepen understanding
- Validate feelings before offering guidance
- Use "I notice..." or "It sounds like..." to reflect back what you hear
- Encourage users to trust their inner voice

Remember: You are facilitating a sacred space for self-discovery. Every interaction should help the user feel seen, heard, and empowered to explore their authentic truth.`
      }),
    });

    const data = await response.json();
    console.log("Session created:", data);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});