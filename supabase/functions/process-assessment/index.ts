import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'

interface AssessmentData {
  user_id: string
  type: string
  responses: Record<string, any>
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get request data
    const { user_id, type, responses }: AssessmentData = await req.json()

    // Calculate assessment score based on type
    let score = 0
    let insights = {}
    let recommendations = []

    switch (type) {
      case 'personality':
        const personalityScores = calculatePersonalityScores(responses)
        score = personalityScores.overall
        insights = personalityScores.traits
        recommendations = generatePersonalityRecommendations(personalityScores)
        break

      case 'values':
        const valuesAnalysis = analyzeValues(responses)
        score = valuesAnalysis.alignment
        insights = valuesAnalysis.topValues
        recommendations = generateValuesRecommendations(valuesAnalysis)
        break

      case 'strengths':
        const strengthsProfile = identifyStrengths(responses)
        score = strengthsProfile.confidence
        insights = strengthsProfile.topStrengths
        recommendations = generateStrengthsRecommendations(strengthsProfile)
        break

      case 'emotional':
        const emotionalProfile = assessEmotionalIntelligence(responses)
        score = emotionalProfile.eq_score
        insights = emotionalProfile.dimensions
        recommendations = generateEmotionalRecommendations(emotionalProfile)
        break

      default:
        score = calculateGenericScore(responses)
        insights = { raw_responses: responses }
        recommendations = ['Complete more assessments for personalized insights']
    }

    // Store assessment results
    const { data: assessment, error: assessmentError } = await supabaseClient
      .from('assessments')
      .insert({
        user_id,
        type,
        score,
        responses,
        insights,
        recommendations
      })
      .select()
      .single()

    if (assessmentError) throw assessmentError

    // Update user progress
    await updateUserProgress(supabaseClient, user_id, type, score)

    // Generate personalized goals based on assessment
    const goals = await generateGoalsFromAssessment(supabaseClient, user_id, type, insights, recommendations)

    return new Response(
      JSON.stringify({ 
        assessment,
        goals,
        message: 'Assessment processed successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error processing assessment:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

// Helper functions

function calculatePersonalityScores(responses: Record<string, any>) {
  // Big Five personality traits calculation
  const traits = {
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    neuroticism: 0
  }

  // Process responses to calculate trait scores
  for (const [question, answer] of Object.entries(responses)) {
    // Map questions to traits and calculate scores
    // This is a simplified example
    if (question.includes('creative') || question.includes('imagination')) {
      traits.openness += Number(answer)
    }
    // ... more trait mappings
  }

  const overall = Object.values(traits).reduce((a, b) => a + b, 0) / 5

  return { overall, traits }
}

function generatePersonalityRecommendations(scores: any) {
  const recommendations = []
  
  if (scores.traits.openness > 7) {
    recommendations.push('Explore creative pursuits and new experiences')
  }
  if (scores.traits.conscientiousness < 5) {
    recommendations.push('Work on building consistent habits and routines')
  }
  // ... more recommendations based on traits

  return recommendations
}

function analyzeValues(responses: Record<string, any>) {
  // Analyze core values from responses
  const valueScores: Record<string, number> = {}
  
  // Process responses to identify top values
  for (const [question, answer] of Object.entries(responses)) {
    // Extract value indicators from responses
    // This is a simplified example
    if (answer > 7) {
      const value = question.split('_')[1] // Extract value from question key
      valueScores[value] = (valueScores[value] || 0) + Number(answer)
    }
  }

  const topValues = Object.entries(valueScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([value]) => value)

  const alignment = Math.min(...Object.values(valueScores)) / Math.max(...Object.values(valueScores))

  return { alignment: alignment * 100, topValues, valueScores }
}

function generateValuesRecommendations(analysis: any) {
  return analysis.topValues.map((value: string) => 
    `Align your goals and decisions with your core value of ${value}`
  )
}

function identifyStrengths(responses: Record<string, any>) {
  const strengthScores: Record<string, number> = {}
  
  for (const [question, answer] of Object.entries(responses)) {
    const strength = extractStrengthFromQuestion(question)
    if (strength) {
      strengthScores[strength] = (strengthScores[strength] || 0) + Number(answer)
    }
  }

  const topStrengths = Object.entries(strengthScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([strength, score]) => ({ strength, score }))

  const confidence = topStrengths.reduce((sum, s) => sum + s.score, 0) / topStrengths.length

  return { confidence, topStrengths, strengthScores }
}

function extractStrengthFromQuestion(question: string): string | null {
  const strengthKeywords = ['leadership', 'communication', 'problem-solving', 'creativity', 'empathy']
  return strengthKeywords.find(keyword => question.toLowerCase().includes(keyword)) || null
}

function generateStrengthsRecommendations(profile: any) {
  return profile.topStrengths.map((s: any) => 
    `Leverage your strength in ${s.strength} for personal and professional growth`
  )
}

function assessEmotionalIntelligence(responses: Record<string, any>) {
  const dimensions = {
    self_awareness: 0,
    self_regulation: 0,
    motivation: 0,
    empathy: 0,
    social_skills: 0
  }

  // Calculate EQ dimensions from responses
  for (const [question, answer] of Object.entries(responses)) {
    // Map questions to EQ dimensions
    // This is a simplified example
    if (question.includes('understand_emotions')) {
      dimensions.self_awareness += Number(answer)
    }
    // ... more dimension mappings
  }

  const eq_score = Object.values(dimensions).reduce((a, b) => a + b, 0) / 5

  return { eq_score: eq_score * 10, dimensions }
}

function generateEmotionalRecommendations(profile: any) {
  const recommendations = []
  
  for (const [dimension, score] of Object.entries(profile.dimensions)) {
    if (score < 5) {
      recommendations.push(`Practice exercises to improve your ${dimension.replace('_', ' ')}`)
    }
  }

  return recommendations
}

function calculateGenericScore(responses: Record<string, any>) {
  const values = Object.values(responses).map(v => Number(v) || 0)
  return values.reduce((a, b) => a + b, 0) / values.length * 10
}

async function updateUserProgress(
  supabase: any,
  userId: string,
  assessmentType: string,
  score: number
) {
  const { data: existing } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('category', 'assessment')
    .eq('subcategory', assessmentType)
    .single()

  if (existing) {
    await supabase
      .from('user_progress')
      .update({
        progress: score,
        milestones: [...(existing.milestones || []), {
          date: new Date().toISOString(),
          score,
          description: `Completed ${assessmentType} assessment`
        }]
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        category: 'assessment',
        subcategory: assessmentType,
        progress: score,
        milestones: [{
          date: new Date().toISOString(),
          score,
          description: `Completed ${assessmentType} assessment`
        }]
      })
  }
}

async function generateGoalsFromAssessment(
  supabase: any,
  userId: string,
  assessmentType: string,
  insights: any,
  recommendations: string[]
) {
  const goals = []

  for (const recommendation of recommendations.slice(0, 3)) {
    const goal = {
      user_id: userId,
      title: recommendation,
      description: `Based on your ${assessmentType} assessment results`,
      category: assessmentType,
      priority: 'medium',
      status: 'active',
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      metadata: {
        generated_from: 'assessment',
        assessment_type: assessmentType,
        insights
      }
    }

    const { data } = await supabase
      .from('goals')
      .insert(goal)
      .select()
      .single()

    if (data) goals.push(data)
  }

  return goals
}