import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'
import { corsHeaders } from '../_shared/cors.ts'
import OpenAI from 'https://esm.sh/openai@4.28.0'

interface AIBuildJob {
  id: string;
  job_type: string;
  target_type: string;
  ai_provider: string;
  ai_model: string;
  prompt: string;
  parameters: any;
  content_specs: any;
}

interface GeneratedContent {
  title: string;
  description: string;
  content: any;
  metadata: any;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Verify the user is authenticated and is an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify admin status
    const { data: isAdminVerified, error: adminError } = await supabase.rpc('verify_admin_status')
    if (adminError || !isAdminVerified) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { jobId } = await req.json()
    
    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the job details
    const { data: job, error: jobError } = await supabase
      .from('ai_build_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update job status to in_progress
    await supabase
      .from('ai_build_jobs')
      .update({ 
        status: 'in_progress', 
        started_at: new Date().toISOString(),
        progress: 10
      })
      .eq('id', jobId)

    try {
      // Generate content using AI
      const generatedContent = await generateContent(job)

      // Update job with generated content
      await supabase
        .from('ai_build_jobs')
        .update({
          status: 'completed',
          progress: 100,
          generated_content: generatedContent,
          completed_at: new Date().toISOString(),
          processing_time_seconds: Math.floor((Date.now() - new Date(job.created_at).getTime()) / 1000)
        })
        .eq('id', jobId)

      // Optionally create the actual assessment/course/exploration record
      if (job.content_specs?.auto_publish) {
        await publishContent(supabase, job, generatedContent)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          jobId,
          content: generatedContent
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (error) {
      console.error('Content generation failed:', error)
      
      // Update job with error
      await supabase
        .from('ai_build_jobs')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error occurred',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)

      return new Response(
        JSON.stringify({ 
          error: 'Content generation failed',
          details: error.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Error in ai-content-generator:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function generateContent(job: AIBuildJob): Promise<GeneratedContent> {
  const { ai_provider, ai_model, prompt, parameters } = job

  if (ai_provider === 'openai') {
    return await generateWithOpenAI(ai_model, prompt, parameters)
  } else {
    throw new Error(`AI provider ${ai_provider} not supported yet`)
  }
}

async function generateWithOpenAI(model: string, prompt: string, parameters: any): Promise<GeneratedContent> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const openai = new OpenAI({ apiKey: openaiApiKey })

  const completion = await openai.chat.completions.create({
    model: model || 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert educational content creator. Generate high-quality, engaging, and pedagogically sound content based on the user\'s specifications. Always return valid JSON format.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: parameters?.temperature || 0.7,
    max_tokens: parameters?.max_tokens || 2000,
    response_format: { type: "json_object" }
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('No content generated from OpenAI')
  }

  try {
    const parsedContent = JSON.parse(content)
    return {
      title: parsedContent.title || 'Generated Content',
      description: parsedContent.description || 'AI-generated educational content',
      content: parsedContent,
      metadata: {
        model_used: model,
        tokens_used: completion.usage?.total_tokens || 0,
        generated_at: new Date().toISOString()
      }
    }
  } catch (parseError) {
    throw new Error(`Failed to parse generated content as JSON: ${parseError.message}`)
  }
}

async function publishContent(supabase: any, job: AIBuildJob, generatedContent: GeneratedContent) {
  const { job_type, content_specs } = job
  const userId = (await supabase.auth.getUser()).data.user?.id

  try {
    switch (job_type) {
      case 'assessment':
        await publishAssessment(supabase, generatedContent, content_specs, userId)
        break
      case 'course':
        await publishCourse(supabase, generatedContent, content_specs, userId)
        break
      case 'exploration':
        await publishExploration(supabase, generatedContent, content_specs, userId)
        break
      default:
        console.warn(`Unknown job type: ${job_type}`)
    }
  } catch (error) {
    console.error(`Failed to publish ${job_type}:`, error)
    throw error
  }
}

async function publishAssessment(supabase: any, content: GeneratedContent, specs: any, userId: string) {
  // Create assessment record
  const assessmentData = {
    slug: generateSlug(content.title),
    title: content.title,
    description: content.description,
    type: specs.assessment_type || 'multiple_choice',
    difficulty: specs.difficulty || 'intermediate',
    estimated_time: specs.estimated_time || 15,
    passing_score: 70,
    is_public: specs.is_public || false,
    requires_auth: specs.requires_auth !== false,
    ai_generated: true,
    ai_provider: 'openai',
    tags: specs.tags || [],
    learning_outcomes: specs.learning_objectives || [],
    created_by: userId
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .insert([assessmentData])
    .select()
    .single()

  if (assessmentError) throw assessmentError

  // Create questions
  if (content.content.questions && Array.isArray(content.content.questions)) {
    for (let i = 0; i < content.content.questions.length; i++) {
      const question = content.content.questions[i]
      
      const questionData = {
        assessment_id: assessment.id,
        question_text: question.question || question.text,
        question_type: specs.assessment_type || 'multiple_choice',
        order_index: i,
        points: question.points || 1,
        explanation: question.explanation
      }

      const { data: createdQuestion, error: questionError } = await supabase
        .from('assessment_questions')
        .insert([questionData])
        .select()
        .single()

      if (questionError) throw questionError

      // Create options for multiple choice questions
      if (question.options && Array.isArray(question.options)) {
        for (let j = 0; j < question.options.length; j++) {
          const option = question.options[j]
          
          const optionData = {
            question_id: createdQuestion.id,
            option_text: typeof option === 'string' ? option : option.text,
            is_correct: option.is_correct || option.correct || false,
            order_index: j,
            score_points: option.is_correct || option.correct ? questionData.points : 0
          }

          const { error: optionError } = await supabase
            .from('assessment_options')
            .insert([optionData])

          if (optionError) throw optionError
        }
      }
    }
  }

  return assessment
}

async function publishCourse(supabase: any, content: GeneratedContent, specs: any, userId: string) {
  const courseData = {
    slug: generateSlug(content.title),
    title: content.title,
    description: content.description,
    difficulty: specs.difficulty || 'intermediate',
    estimated_duration_hours: specs.estimated_duration || 2,
    is_published: specs.is_published || false,
    tags: specs.tags || [],
    created_by: userId
  }

  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert([courseData])
    .select()
    .single()

  if (courseError) throw courseError

  // Create course modules if provided
  if (content.content.modules && Array.isArray(content.content.modules)) {
    for (let i = 0; i < content.content.modules.length; i++) {
      const module = content.content.modules[i]
      
      const moduleData = {
        course_id: course.id,
        title: module.title,
        description: module.description,
        content_type: 'lesson',
        order_index: i
      }

      await supabase
        .from('course_modules')
        .insert([moduleData])
    }
  }

  return course
}

async function publishExploration(supabase: any, content: GeneratedContent, specs: any, userId: string) {
  const explorationData = {
    slug: generateSlug(content.title),
    title: content.title,
    description: content.description,
    content: content.content,
    difficulty: specs.difficulty || 'intermediate',
    estimated_time: specs.estimated_time || 20,
    is_public: specs.is_public || false,
    tags: specs.tags || [],
    created_by: userId
  }

  const { data: exploration, error: explorationError } = await supabase
    .from('explorations')
    .insert([explorationData])
    .select()
    .single()

  if (explorationError) throw explorationError

  return exploration
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)
}