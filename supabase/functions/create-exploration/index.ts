import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateExplorationPayload {
  topic: string;
  provider: 'openai';
  model: string;
  category?: string;
  visibility?: 'public' | 'private';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration?: number;
  questionCount?: number;
  customPrompt?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Authorization header required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = auth.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload: CreateExplorationPayload = await req.json();

    if (!payload.topic || !payload.provider || !payload.model) {
      return new Response(JSON.stringify({ error: 'Missing required fields: topic, provider, model' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const questionCount = payload.questionCount || 8;
    const difficulty = payload.difficulty || 'intermediate';
    const category = payload.category || 'self-discovery';
    const estimatedDuration = payload.estimated_duration || 15;

    const systemPrompt = `You are an expert in designing transformative self-discovery explorations for women. Create a guided exploration about "${payload.topic}" with ${questionCount} reflective steps and supportive guidance.

Audience: Women seeking personal growth
Difficulty: ${difficulty}
Category: ${category}
Tone: Empathetic, warm, empowering

Structure guidelines:
- Begin with a grounding introduction
- Provide ${questionCount} reflective prompts/activities in a progressive journey
- Each step must include: question_text (free_text), explanation (gentle guidance)
- Include facilitator_prompt and higher_self_prompt strings for the AI coach tone
- Provide analysis_structure JSON for summarizing responses into insights, strengths, and next steps
- Provide meta: difficulty_level, crystal_reward (10-50), estimated_duration (minutes)

${payload.customPrompt ? `Additional instructions: ${payload.customPrompt}` : ''}`;

    const expectedFormat = `Return a JSON object with this exact structure:
{
  "title": "Exploration title",
  "description": "2-3 sentence description",
  "facilitator_prompt": "Short instruction used by the facilitator persona",
  "higher_self_prompt": "Short instruction used by the Higher Self persona",
  "difficulty_level": "beginner|intermediate|advanced",
  "crystal_reward": 20,
  "estimated_duration": ${estimatedDuration},
  "category": "${category}",
  "questions": [
    { "question_text": "Reflective prompt", "question_type": "free_text", "position": 1, "explanation": "Gentle guidance" }
  ],
  "analysis_structure": {
    "sections": [
      { "title": "Key Insights", "fields": ["insight"] },
      { "title": "Strengths", "fields": ["strength"] },
      { "title": "Recommended Next Steps", "fields": ["action"] }
    ]
  }
}`;

    let generatedContent: any;

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: payload.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: expectedFormat }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 5000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    generatedContent = JSON.parse(data.choices[0].message.content);

    // Log generation
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'AI_EXPLORATION_GENERATED',
      details: {
        topic: payload.topic,
        provider: payload.provider,
        model: payload.model,
      }
    });

    return new Response(JSON.stringify({ success: true, generated_content: generatedContent }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Exploration creation error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to create exploration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

