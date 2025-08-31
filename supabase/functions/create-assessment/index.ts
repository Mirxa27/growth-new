/// <reference types="https://esm.sh/v135/@deno/types@0.1.43/index.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.6';
import { Database } from '../../types'; // Import the Database type

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateAssessmentPayload {
  topic: string;
  type: 'quiz' | 'test' | 'exploration' | 'course';
  provider: 'openai' | 'anthropic';
  model: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  questionCount?: number;
  category?: string;
  visibility?: 'public' | 'private';
  customPrompt?: string;
  targetAudience?: string;
}

const supabase = createClient<Database>(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    // Verify authentication and admin access
    const auth = req.headers.get('Authorization');
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = auth.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: CreateAssessmentPayload = await req.json();

    // Validate required fields
    if (!payload.topic || !payload.type || !payload.provider || !payload.model) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: topic, type, provider, model' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build AI prompt based on content type
    const questionCount = payload.questionCount || 10;
    const difficulty = payload.difficulty || 'intermediate';
    const category = payload.category || 'general';
    const targetAudience = payload.targetAudience || 'Women seeking personal growth';

    let systemPrompt = '';
    let expectedFormat = '';

    switch (payload.type) {
      case 'quiz':
        systemPrompt = `You are an expert quiz creator specializing in personal growth and wellness for women. Create an engaging, educational quiz about "${payload.topic}" with ${questionCount} multiple-choice questions.

Target Audience: ${targetAudience}
Difficulty Level: ${difficulty}
Category: ${category}

Guidelines:
- Questions should be thought-provoking and relevant to women's personal development
- Include a mix of knowledge-based and reflection-based questions
- Provide clear, concise answer options
- Include explanations for correct answers that offer insights or learning opportunities
- Make the content empowering and supportive

${payload.customPrompt ? `Additional Instructions: ${payload.customPrompt}` : ''}`;

        expectedFormat = `Return a JSON object with this exact structure:
{
  "title": "Engaging quiz title",
  "description": "Brief, compelling description (2-3 sentences)",
  "questions": [
    {
      "question_text": "Question text here",
      "question_type": "multiple_choice",
      "position": 1,
      "points": 1,
      "explanation": "Why this answer is correct and what it means",
      "options": [
        {
          "option_text": "Option A text",
          "is_correct": false,
          "position": 1,
          "score_value": 0
        },
        {
          "option_text": "Option B text", 
          "is_correct": true,
          "position": 2,
          "score_value": 1
        }
      ]
    }
  ]
}`;
        break;

      case 'test':
        systemPrompt = `You are an expert test creator specializing in personal growth assessment for women. Create a comprehensive test about "${payload.topic}" with ${questionCount} questions that accurately measure understanding and growth.

Target Audience: ${targetAudience}
Difficulty Level: ${difficulty}
Category: ${category}

Guidelines:
- Create questions that assess both knowledge and practical application
- Include varied question types (multiple choice, true/false, scenario-based)
- Ensure questions are progressive in difficulty
- Provide detailed explanations for all answers
- Focus on actionable insights and self-awareness

${payload.customPrompt ? `Additional Instructions: ${payload.customPrompt}` : ''}`;

        expectedFormat = `Return a JSON object with the same structure as quiz format.`;
        break;

      case 'exploration':
        systemPrompt = `You are an expert in creating transformative self-discovery explorations for women. Create a guided exploration about "${payload.topic}" with ${questionCount} reflective questions and activities.

Target Audience: ${targetAudience}
Difficulty Level: ${difficulty}
Category: ${category}

Guidelines:
- Focus on deep self-reflection and personal insights
- Include both questions and suggested activities
- Create a journey that builds understanding progressively
- Encourage vulnerability and authentic self-expression
- Provide gentle guidance and support throughout

${payload.customPrompt ? `Additional Instructions: ${payload.customPrompt}` : ''}`;

        expectedFormat = `Return a JSON object with this structure:
{
  "title": "Exploration title",
  "description": "Compelling description of the exploration journey",
  "questions": [
    {
      "question_text": "Reflective question or activity prompt",
      "question_type": "free_text",
      "position": 1,
      "explanation": "Guidance for reflection or activity instructions"
    }
  ]
}`;
        break;

      case 'course':
        systemPrompt = `You are an expert course designer specializing in women's personal development. Create a comprehensive course about "${payload.topic}" with multiple modules and learning activities.

Target Audience: ${targetAudience}
Difficulty Level: ${difficulty}
Category: ${category}

Guidelines:
- Structure content into logical learning modules
- Include theoretical knowledge and practical applications
- Create engaging activities and assessments
- Build skills progressively throughout the course
- Provide actionable takeaways for real-world application

${payload.customPrompt ? `Additional Instructions: ${payload.customPrompt}` : ''}`;

        expectedFormat = `Return a JSON object with this structure:
{
  "title": "Course title",
  "description": "Comprehensive course description",
  "modules": [
    {
      "title": "Module title",
      "description": "Module overview",
      "lessons": ["Lesson 1", "Lesson 2"],
      "activities": ["Activity description"],
      "assessment": {
        "title": "Module assessment",
        "questions": []
      }
    }
  ]
}`;
        break;
    }

    // Call AI service based on provider
    let generatedContent;
    
    if (payload.provider === 'openai') {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiKey) {
        throw new Error('OpenAI API key not configured');
      }

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
          max_tokens: 4000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      generatedContent = JSON.parse(data.choices[0].message.content);
    } else {
      throw new Error(`Provider ${payload.provider} not yet implemented`);
    }

    // Save the generated content to database
    const { data: assessmentId, error: saveError } = await supabase
      .rpc('create_assessment_with_questions', {
        _title: generatedContent.title,
        _description: generatedContent.description,
        _type: payload.type,
        _visibility: payload.visibility || 'private',
        _difficulty: difficulty,
        _category: category,
        _ai_provider: payload.provider,
        _ai_model: payload.model,
        _ai_prompt: systemPrompt,
        _questions: generatedContent.questions || [],
        _created_by: user.id
      });

    if (saveError) {
      console.error('Database save error:', saveError);
      throw new Error(`Failed to save assessment: ${saveError.message}`);
    }

    // Log the generation for admin tracking
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: user.id,
        action: 'AI_CONTENT_GENERATED',
        details: {
          assessment_id: assessmentId,
          topic: payload.topic,
          type: payload.type,
          provider: payload.provider,
          model: payload.model,
          question_count: generatedContent.questions?.length || 0
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        assessment_id: assessmentId,
        title: generatedContent.title,
        question_count: generatedContent.questions?.length || 0,
        generated_content: generatedContent
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Assessment creation error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create assessment',
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});