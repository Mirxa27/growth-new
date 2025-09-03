import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateCoursePayload {
  topic: string;
  provider: 'openai';
  model: string;
  category?: string;
  visibility?: 'public' | 'private';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
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

    const payload: CreateCoursePayload = await req.json();

    if (!payload.topic || !payload.provider || !payload.model) {
      return new Response(JSON.stringify({ error: 'Missing required fields: topic, provider, model' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const category = payload.category || 'general';
    const difficulty = payload.difficulty || 'beginner';

    const systemPrompt = `You are an expert course designer for women's personal development. Create a complete course about "${payload.topic}" with 4-6 modules, each with lessons, activities, and an assessment.

Category: ${category}
Difficulty: ${difficulty}
Audience: Women seeking personal growth
Tone: Empowering, practical, supportive

${payload.customPrompt ? `Additional instructions: ${payload.customPrompt}` : ''}`;

    const expectedFormat = `Return a JSON object with this exact structure:
{
  "title": "Course title",
  "description": "Course description",
  "learning_objectives": ["objective 1", "objective 2"],
  "modules": [
    {
      "title": "Module title",
      "description": "Module overview",
      "lessons": [
        { "title": "Lesson title", "summary": "short summary" }
      ],
      "activities": ["Activity description"],
      "assessment": { "title": "Module assessment", "questions": [] }
    }
  ]
}`;

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
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const course = JSON.parse(data.choices[0].message.content);

    // Log generation event only; saving will happen from client after admin edits
    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: 'AI_COURSE_GENERATED',
      details: { topic: payload.topic, provider: payload.provider, model: payload.model }
    });

    return new Response(JSON.stringify({ success: true, generated_content: course }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Course creation error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to create course' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

