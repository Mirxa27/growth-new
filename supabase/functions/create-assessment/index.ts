import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AssessmentParams {
  topic: string
  type: 'quiz' | 'test' | 'exploration' | 'course'
  provider: string
  model: string
  questionCount: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  category?: string
  customPrompt?: string
}

interface GeneratedContent {
  title: string
  description: string
  questions: Array<{
    question_text: string
    question_type: 'multiple_choice' | 'free_text' | 'image'
    position: number
    points?: number
    explanation?: string
    options?: Array<{
      option_text: string
      is_correct: boolean
      position: number
      score_value?: number
      feedback?: string
    }>
  }>
}

async function generateWithOpenAI(apiKey: string, params: AssessmentParams): Promise<GeneratedContent> {
  const systemPrompt = `You are an expert assessment creator specializing in women's personal development and growth. Create high-quality, engaging content that is supportive, empowering, and transformative.`
  
  const userPrompt = params.customPrompt || getDefaultPrompt(params.type, params.topic, params.questionCount, params.difficulty)
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return JSON.parse(data.choices[0].message.content)
}

async function generateWithAnthropic(apiKey: string, params: AssessmentParams): Promise<GeneratedContent> {
  const systemPrompt = `You are an expert assessment creator specializing in women's personal development and growth. Create high-quality, engaging content that is supportive, empowering, and transformative. Always respond with valid JSON.`
  
  const userPrompt = params.customPrompt || getDefaultPrompt(params.type, params.topic, params.questionCount, params.difficulty)
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: 4096,
      messages: [
        { role: 'user', content: `${systemPrompt}\n\n${userPrompt}\n\nRespond only with valid JSON.` }
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`)
  }

  const data = await response.json()
  return JSON.parse(data.content[0].text)
}

async function generateWithGoogle(apiKey: string, params: AssessmentParams): Promise<GeneratedContent> {
  const prompt = params.customPrompt || getDefaultPrompt(params.type, params.topic, params.questionCount, params.difficulty)
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are an expert assessment creator. ${prompt}\n\nRespond only with valid JSON.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      }
    }),
  })

  if (!response.ok) {
    throw new Error(`Google AI API error: ${response.statusText}`)
  }

  const data = await response.json()
  return JSON.parse(data.candidates[0].content.parts[0].text)
}

function getDefaultPrompt(type: string, topic: string, questionCount: number, difficulty?: string): string {
  const difficultyText = difficulty ? ` at ${difficulty} level` : ''
  
  switch (type) {
    case 'quiz':
      return `Create a quiz about "${topic}"${difficultyText} with exactly ${questionCount} multiple-choice questions. Each question should have 4 options with only one correct answer. Include explanations for each question and feedback for each option. Format as JSON with structure: { "title": "...", "description": "...", "questions": [...] }`
      
    case 'test':
      return `Create a comprehensive assessment test about "${topic}"${difficultyText} with exactly ${questionCount} questions. Mix multiple-choice and free-text questions. Include point values and explanations. Format as JSON with structure: { "title": "...", "description": "...", "questions": [...] }`
      
    case 'exploration':
      return `Create a deep personal exploration journey about "${topic}"${difficultyText} with exactly ${questionCount} open-ended, reflective questions. These should prompt deep self-reflection and personal insights. Use only free_text question types. Format as JSON with structure: { "title": "...", "description": "...", "questions": [...] }`
      
    case 'course':
      return `Create a learning module about "${topic}"${difficultyText} with ${questionCount} lessons/activities. Include a mix of educational content and assessment questions. Structure it as a progressive learning experience. Format as JSON with structure: { "title": "...", "description": "...", "questions": [...] }`
      
    default:
      return `Create content about "${topic}" with ${questionCount} items.`
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the request body
    const params: AssessmentParams = await req.json()
    
    // Validate required parameters
    if (!params.topic || !params.type || !params.provider || !params.model || !params.questionCount) {
      throw new Error('Missing required parameters')
    }

    // Get the appropriate API key
    let apiKey: string | undefined
    
    switch (params.provider) {
      case 'openai':
        apiKey = Deno.env.get('OPENAI_API_KEY')
        break
      case 'anthropic':
        apiKey = Deno.env.get('ANTHROPIC_API_KEY')
        break
      case 'google':
        apiKey = Deno.env.get('GOOGLE_API_KEY')
        break
      default:
        throw new Error(`Unsupported provider: ${params.provider}`)
    }

    if (!apiKey) {
      throw new Error(`API key not configured for provider: ${params.provider}`)
    }

    // Generate content based on provider
    let generatedContent: GeneratedContent
    
    switch (params.provider) {
      case 'openai':
        generatedContent = await generateWithOpenAI(apiKey, params)
        break
      case 'anthropic':
        generatedContent = await generateWithAnthropic(apiKey, params)
        break
      case 'google':
        generatedContent = await generateWithGoogle(apiKey, params)
        break
      default:
        throw new Error(`Unsupported provider: ${params.provider}`)
    }

    // Validate the generated content
    if (!generatedContent.title || !generatedContent.description || !Array.isArray(generatedContent.questions)) {
      throw new Error('Invalid content structure generated')
    }

    // Ensure questions have required fields and proper structure
    generatedContent.questions = generatedContent.questions.map((q, index) => ({
      ...q,
      position: q.position || index + 1,
      question_type: q.question_type || (params.type === 'exploration' ? 'free_text' : 'multiple_choice'),
      points: q.points || 1,
      options: q.options?.map((opt, optIndex) => ({
        ...opt,
        position: opt.position || optIndex + 1,
        is_correct: opt.is_correct || false,
        score_value: opt.score_value || (opt.is_correct ? 1 : 0)
      }))
    }))

    return new Response(
      JSON.stringify({ 
        success: true, 
        generated_content: generatedContent,
        metadata: {
          provider: params.provider,
          model: params.model,
          type: params.type,
          question_count: generatedContent.questions.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in create-assessment function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})