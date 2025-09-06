import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface AssessmentResponse {
  user_id: string
  assessment_id: string
  attempt_id: string
  responses: Record<string, any>
  duration_seconds?: number
}

interface AIAnalysisResult {
  personality_type?: string
  insights: string[]
  recommendations: string[]
  strengths: string[]
  areas_for_improvement: string[]
  personalized_feedback: string
  growth_plan: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const { user_id, assessment_id, attempt_id, responses, duration_seconds }: AssessmentResponse = await req.json()

    if (!user_id || !assessment_id || !attempt_id || !responses) {
      throw new Error('Missing required fields')
    }

    // Get assessment details
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        *,
        assessment_questions (
          *,
          assessment_options (*)
        )
      `)
      .eq('id', assessment_id)
      .single()

    if (assessmentError || !assessment) {
      throw new Error('Assessment not found')
    }

    // Calculate score and analyze responses
    let totalScore = 0
    let maxScore = 0
    const categoryScores: Record<string, number> = {}
    const responseAnalysis: Record<string, any> = {}

    // Process each response
    for (const question of assessment.assessment_questions) {
      const userResponse = responses[question.id]
      if (!userResponse) continue

      maxScore += question.points || 1

      // Find the selected option
      const selectedOption = question.assessment_options.find(
        (opt: any) => opt.id === userResponse || opt.position === userResponse
      )

      if (selectedOption) {
        const questionScore = selectedOption.score_value || (selectedOption.is_correct ? question.points : 0)
        totalScore += questionScore

        // Track category scores for personality assessments
        if (selectedOption.metadata?.category) {
          const category = selectedOption.metadata.category
          categoryScores[category] = (categoryScores[category] || 0) + questionScore
        }

        responseAnalysis[question.id] = {
          question: question.question_text,
          response: selectedOption.option_text,
          score: questionScore,
          feedback: selectedOption.feedback
        }
      }
    }

    const percentageScore = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const passed = percentageScore >= (assessment.pass_score || 70)

    // Determine personality type for personality assessments
    let personalityType = null
    if (assessment.type === 'personality' && Object.keys(categoryScores).length > 0) {
      personalityType = Object.entries(categoryScores).reduce((a, b) => 
        categoryScores[a[0]] > categoryScores[b[0]] ? a : b
      )[0]
    }

    // Prepare AI analysis if OpenAI key is available
    let aiAnalysis: AIAnalysisResult = {
      insights: [],
      recommendations: [],
      strengths: [],
      areas_for_improvement: [],
      personalized_feedback: '',
      growth_plan: []
    }

    if (openaiApiKey) {
      try {
        const aiPrompt = `
You are an expert assessment analyzer specializing in personal development and growth. 
Analyze the following assessment results and provide personalized insights.

Assessment: ${assessment.title}
Type: ${assessment.type}
Description: ${assessment.description}

User Responses Analysis:
${JSON.stringify(responseAnalysis, null, 2)}

Category Scores: ${JSON.stringify(categoryScores, null, 2)}
Total Score: ${totalScore}/${maxScore} (${percentageScore.toFixed(1)}%)
Personality Type: ${personalityType || 'Not determined'}

Please provide a comprehensive analysis with:
1. 3-5 key insights about the person's profile
2. 3-5 personalized recommendations for growth
3. 2-4 identified strengths
4. 2-3 areas for improvement
5. A warm, encouraging personalized feedback message (2-3 sentences)
6. 3-5 specific action steps for a growth plan

Make the response empowering, actionable, and tailored to women's personal development.
Respond in valid JSON format with the following structure:
{
  "insights": ["insight1", "insight2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "strengths": ["strength1", "strength2", ...],
  "areas_for_improvement": ["area1", "area2", ...],
  "personalized_feedback": "Your encouraging message here...",
  "growth_plan": ["step1", "step2", ...]
}
`

        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: assessment.ai_model || 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert personal development coach and assessment analyzer. Provide insightful, actionable, and empowering feedback.'
              },
              {
                role: 'user',
                content: aiPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1500
          })
        })

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json()
          const aiContent = aiResult.choices[0]?.message?.content

          if (aiContent) {
            try {
              aiAnalysis = JSON.parse(aiContent)
              if (personalityType) {
                aiAnalysis.personality_type = personalityType
              }
            } catch (parseError) {
              console.error('Failed to parse AI response:', parseError)
              // Fallback to basic analysis
              aiAnalysis = {
                insights: [`Your assessment score of ${percentageScore.toFixed(1)}% reflects your current development level.`],
                recommendations: ['Continue your personal growth journey with consistent practice.'],
                strengths: ['Self-awareness through assessment completion'],
                areas_for_improvement: ['Areas identified through your responses'],
                personalized_feedback: 'Thank you for completing this assessment. Your results provide valuable insights for your personal growth journey.',
                growth_plan: ['Review your results regularly', 'Set specific development goals', 'Track your progress over time']
              }
            }
          }
        }
      } catch (aiError) {
        console.error('AI analysis failed:', aiError)
        // Continue without AI analysis
      }
    }

    // Update attempt record
    const { error: updateError } = await supabase
      .from('user_assessment_attempts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        duration_seconds,
        raw_score: totalScore,
        max_score: maxScore,
        percentage_score: percentageScore,
        passed,
        personality_type: personalityType,
        ai_analysis: aiAnalysis,
        insights: aiAnalysis.insights,
        recommendations: aiAnalysis.recommendations,
        strengths: aiAnalysis.strengths,
        areas_for_improvement: aiAnalysis.areas_for_improvement,
        updated_at: new Date().toISOString()
      })
      .eq('id', attempt_id)

    if (updateError) {
      throw updateError
    }

    // Create assessment result record
    const { data: result, error: resultError } = await supabase
      .from('assessment_results')
      .insert({
        user_id,
        assessment_id,
        attempt_id,
        score: totalScore,
        max_score: maxScore,
        percentage: percentageScore,
        grade: getGrade(percentageScore),
        personality_type: personalityType,
        dominant_traits: Object.keys(categoryScores).slice(0, 3),
        category_scores: categoryScores,
        ai_feedback: aiAnalysis.personalized_feedback,
        personalized_insights: aiAnalysis.insights.join('\n'),
        growth_recommendations: aiAnalysis.recommendations,
        next_steps: aiAnalysis.growth_plan
      })
      .select()
      .single()

    if (resultError) {
      throw resultError
    }

    // Update assessment analytics
    await updateAssessmentAnalytics(supabase, assessment_id, totalScore, maxScore, duration_seconds)

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          id: result.id,
          score: totalScore,
          max_score: maxScore,
          percentage: percentageScore,
          passed,
          personality_type: personalityType,
          category_scores: categoryScores,
          ai_analysis: aiAnalysis
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error processing assessment:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 85) return 'A'
  if (percentage >= 80) return 'A-'
  if (percentage >= 75) return 'B+'
  if (percentage >= 70) return 'B'
  if (percentage >= 65) return 'B-'
  if (percentage >= 60) return 'C+'
  if (percentage >= 55) return 'C'
  if (percentage >= 50) return 'C-'
  return 'D'
}

async function updateAssessmentAnalytics(
  supabase: any, 
  assessmentId: string, 
  score: number, 
  maxScore: number, 
  duration: number
) {
  try {
    const { data: analytics } = await supabase
      .from('assessment_analytics')
      .select('*')
      .eq('assessment_id', assessmentId)
      .single()

    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0

    if (analytics) {
      // Update existing analytics
      const newAttempts = analytics.total_attempts + 1
      const newCompletions = analytics.total_completions + 1
      const newAvgScore = ((analytics.average_score * analytics.total_completions) + percentage) / newCompletions
      const newAvgDuration = duration 
        ? ((analytics.average_duration_seconds * analytics.total_completions) + duration) / newCompletions
        : analytics.average_duration_seconds

      await supabase
        .from('assessment_analytics')
        .update({
          total_attempts: newAttempts,
          total_completions: newCompletions,
          average_score: newAvgScore,
          average_duration_seconds: newAvgDuration,
          completion_rate: (newCompletions / newAttempts) * 100,
          last_updated: new Date().toISOString()
        })
        .eq('assessment_id', assessmentId)
    } else {
      // Create new analytics record
      await supabase
        .from('assessment_analytics')
        .insert({
          assessment_id: assessmentId,
          total_attempts: 1,
          total_completions: 1,
          average_score: percentage,
          average_duration_seconds: duration || 0,
          completion_rate: 100
        })
    }
  } catch (error) {
    console.error('Failed to update analytics:', error)
  }
}
