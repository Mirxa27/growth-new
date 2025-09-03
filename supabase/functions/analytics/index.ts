import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { corsHeaders } from '../_shared/cors.ts'

interface AnalyticsRequest {
  user_id?: string
  date_range?: {
    start: string
    end: string
  }
  metrics?: string[]
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    // Parse request
    const { user_id, date_range, metrics }: AnalyticsRequest = await req.json()
    const targetUserId = user_id || user.id

    // Check if user has permission to view analytics
    if (targetUserId !== user.id) {
      // Check if user is admin
      const { data: profile } = await supabaseClient
        .from('user_profiles')
        .select('metadata')
        .eq('id', user.id)
        .single()

      if (profile?.metadata?.role !== 'admin') {
        throw new Error('Unauthorized to view other user analytics')
      }
    }

    // Calculate date range
    const endDate = date_range?.end || new Date().toISOString()
    const startDate = date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Fetch analytics data
    const analyticsData = await gatherAnalytics(
      supabaseClient,
      targetUserId,
      startDate,
      endDate,
      metrics || ['all']
    )

    // Calculate insights
    const insights = generateInsights(analyticsData)

    return new Response(
      JSON.stringify({
        user_id: targetUserId,
        date_range: { start: startDate, end: endDate },
        analytics: analyticsData,
        insights
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Analytics error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

async function gatherAnalytics(
  supabase: any,
  userId: string,
  startDate: string,
  endDate: string,
  metrics: string[]
) {
  const analytics: any = {}
  const includeAll = metrics.includes('all')

  // User engagement metrics
  if (includeAll || metrics.includes('engagement')) {
    analytics.engagement = await getEngagementMetrics(supabase, userId, startDate, endDate)
  }

  // Goal progress metrics
  if (includeAll || metrics.includes('goals')) {
    analytics.goals = await getGoalMetrics(supabase, userId, startDate, endDate)
  }

  // Assessment metrics
  if (includeAll || metrics.includes('assessments')) {
    analytics.assessments = await getAssessmentMetrics(supabase, userId, startDate, endDate)
  }

  // Journal metrics
  if (includeAll || metrics.includes('journal')) {
    analytics.journal = await getJournalMetrics(supabase, userId, startDate, endDate)
  }

  // Chat metrics
  if (includeAll || metrics.includes('chat')) {
    analytics.chat = await getChatMetrics(supabase, userId, startDate, endDate)
  }

  // Voice metrics
  if (includeAll || metrics.includes('voice')) {
    analytics.voice = await getVoiceMetrics(supabase, userId, startDate, endDate)
  }

  // Growth metrics
  if (includeAll || metrics.includes('growth')) {
    analytics.growth = await getGrowthMetrics(supabase, userId, startDate, endDate)
  }

  return analytics
}

async function getEngagementMetrics(supabase: any, userId: string, startDate: string, endDate: string) {
  // Get login sessions
  const { data: sessions } = await supabase
    .from('auth.sessions')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  // Calculate daily active days
  const activeDays = new Set(
    sessions?.map((s: any) => new Date(s.created_at).toDateString()) || []
  ).size

  // Get total activities
  const [assessments, goals, journal, chats] = await Promise.all([
    supabase.from('assessments').select('id').eq('user_id', userId).gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('goals').select('id').eq('user_id', userId).gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('journal_entries').select('id').eq('user_id', userId).gte('created_at', startDate).lte('created_at', endDate),
    supabase.from('chat_sessions').select('id').eq('user_id', userId).gte('created_at', startDate).lte('created_at', endDate)
  ])

  const totalActivities = 
    (assessments.data?.length || 0) +
    (goals.data?.length || 0) +
    (journal.data?.length || 0) +
    (chats.data?.length || 0)

  return {
    active_days: activeDays,
    total_activities: totalActivities,
    average_daily_activities: totalActivities / Math.max(activeDays, 1),
    engagement_score: calculateEngagementScore(activeDays, totalActivities)
  }
}

async function getGoalMetrics(supabase: any, userId: string, startDate: string, endDate: string) {
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  const completed = goals?.filter((g: any) => g.status === 'completed').length || 0
  const total = goals?.length || 0
  const completionRate = total > 0 ? (completed / total) * 100 : 0

  // Calculate goal categories
  const categories = goals?.reduce((acc: any, goal: any) => {
    acc[goal.category] = (acc[goal.category] || 0) + 1
    return acc
  }, {}) || {}

  return {
    total_goals: total,
    completed_goals: completed,
    active_goals: goals?.filter((g: any) => g.status === 'active').length || 0,
    completion_rate: completionRate,
    categories,
    average_completion_time: calculateAverageCompletionTime(goals)
  }
}

async function getAssessmentMetrics(supabase: any, userId: string, startDate: string, endDate: string) {
  const { data: assessments } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true })

  const scoresByType = assessments?.reduce((acc: any, assessment: any) => {
    if (!acc[assessment.type]) {
      acc[assessment.type] = []
    }
    acc[assessment.type].push({
      score: assessment.score,
      date: assessment.created_at
    })
    return acc
  }, {}) || {}

  // Calculate improvement trends
  const trends = Object.entries(scoresByType).reduce((acc: any, [type, scores]: [string, any]) => {
    if (scores.length > 1) {
      const firstScore = scores[0].score
      const lastScore = scores[scores.length - 1].score
      acc[type] = {
        improvement: lastScore - firstScore,
        percentage_change: ((lastScore - firstScore) / firstScore) * 100
      }
    }
    return acc
  }, {})

  return {
    total_assessments: assessments?.length || 0,
    types_completed: Object.keys(scoresByType),
    average_score: assessments?.reduce((sum: number, a: any) => sum + a.score, 0) / (assessments?.length || 1),
    scores_by_type: scoresByType,
    improvement_trends: trends
  }
}

async function getJournalMetrics(supabase: any, userId: string, startDate: string, endDate: string) {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  // Analyze mood patterns
  const moodCounts = entries?.reduce((acc: any, entry: any) => {
    if (entry.mood) {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1
    }
    return acc
  }, {}) || {}

  // Analyze tags
  const tagCounts = entries?.reduce((acc: any, entry: any) => {
    if (entry.tags && Array.isArray(entry.tags)) {
      entry.tags.forEach((tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1
      })
    }
    return acc
  }, {}) || {}

  // Calculate consistency
  const entryDates = new Set(
    entries?.map((e: any) => new Date(e.created_at).toDateString()) || []
  )
  const totalDays = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  const consistency = (entryDates.size / totalDays) * 100

  return {
    total_entries: entries?.length || 0,
    mood_distribution: moodCounts,
    top_tags: Object.entries(tagCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count })),
    consistency_percentage: consistency,
    average_entry_length: entries?.reduce((sum: number, e: any) => sum + (e.content?.length || 0), 0) / (entries?.length || 1)
  }
}

async function getChatMetrics(supabase: any, userId: string, startDate: string, endDate: string) {
  const { data: sessions } = await supabase
    .from('chat_sessions')
    .select('*, chat_messages(*)')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  const totalMessages = sessions?.reduce((sum: number, session: any) => 
    sum + (session.chat_messages?.length || 0), 0) || 0

  const averageSessionLength = sessions?.reduce((sum: number, session: any) => {
    if (session.chat_messages?.length > 0) {
      const messages = session.chat_messages
      const firstMessage = new Date(messages[0].created_at)
      const lastMessage = new Date(messages[messages.length - 1].created_at)
      return sum + (lastMessage.getTime() - firstMessage.getTime()) / 1000 / 60 // minutes
    }
    return sum
  }, 0) / (sessions?.length || 1)

  return {
    total_sessions: sessions?.length || 0,
    total_messages: totalMessages,
    average_messages_per_session: totalMessages / (sessions?.length || 1),
    average_session_duration_minutes: averageSessionLength,
    topics_discussed: extractTopicsFromSessions(sessions)
  }
}

async function getVoiceMetrics(supabase: any, userId: string, startDate: string, endDate: string) {
  const { data: voiceSessions } = await supabase
    .from('voice_sessions')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  const totalDuration = voiceSessions?.reduce((sum: number, session: any) => 
    sum + (session.duration || 0), 0) || 0

  return {
    total_voice_sessions: voiceSessions?.length || 0,
    total_duration_minutes: totalDuration / 60,
    average_session_duration: totalDuration / (voiceSessions?.length || 1) / 60,
    emotion_patterns: analyzeEmotionPatterns(voiceSessions)
  }
}

async function getGrowthMetrics(supabase: any, userId: string, startDate: string, endDate: string) {
  const { data: progress } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .gte('updated_at', startDate)
    .lte('updated_at', endDate)

  const growthByCategory = progress?.reduce((acc: any, p: any) => {
    if (!acc[p.category]) {
      acc[p.category] = {
        current: p.progress,
        milestones: p.milestones?.length || 0
      }
    }
    return acc
  }, {}) || {}

  // Calculate overall growth score
  const overallGrowth = Object.values(growthByCategory).reduce((sum: any, cat: any) => 
    sum + cat.current, 0) / Object.keys(growthByCategory).length

  return {
    overall_growth_score: overallGrowth || 0,
    growth_by_category: growthByCategory,
    total_milestones: Object.values(growthByCategory).reduce((sum: any, cat: any) => 
      sum + cat.milestones, 0),
    areas_of_focus: identifyAreasOfFocus(growthByCategory)
  }
}

function calculateEngagementScore(activeDays: number, totalActivities: number): number {
  // Weighted engagement score
  const dayScore = Math.min(activeDays / 30, 1) * 50 // 50% weight for consistency
  const activityScore = Math.min(totalActivities / 100, 1) * 50 // 50% weight for activity volume
  return dayScore + activityScore
}

function calculateAverageCompletionTime(goals: any[]): number {
  const completedGoals = goals?.filter(g => g.status === 'completed' && g.completed_at) || []
  if (completedGoals.length === 0) return 0

  const totalTime = completedGoals.reduce((sum, goal) => {
    const created = new Date(goal.created_at)
    const completed = new Date(goal.completed_at)
    return sum + (completed.getTime() - created.getTime())
  }, 0)

  return totalTime / completedGoals.length / (1000 * 60 * 60 * 24) // days
}

function extractTopicsFromSessions(sessions: any[]): string[] {
  // This would ideally use NLP, but for now we'll extract based on common keywords
  const topics = new Set<string>()
  
  sessions?.forEach(session => {
    session.chat_messages?.forEach((message: any) => {
      const content = message.content.toLowerCase()
      if (content.includes('goal')) topics.add('Goals')
      if (content.includes('stress') || content.includes('anxiety')) topics.add('Mental Health')
      if (content.includes('relationship')) topics.add('Relationships')
      if (content.includes('career') || content.includes('work')) topics.add('Career')
      if (content.includes('health') || content.includes('fitness')) topics.add('Health')
    })
  })

  return Array.from(topics)
}

function analyzeEmotionPatterns(voiceSessions: any[]): any {
  const emotions = voiceSessions?.reduce((acc: any, session: any) => {
    if (session.metadata?.emotions) {
      Object.entries(session.metadata.emotions).forEach(([emotion, score]: [string, any]) => {
        if (!acc[emotion]) acc[emotion] = []
        acc[emotion].push(score)
      })
    }
    return acc
  }, {}) || {}

  // Calculate average scores for each emotion
  return Object.entries(emotions).reduce((acc: any, [emotion, scores]: [string, any]) => {
    acc[emotion] = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length
    return acc
  }, {})
}

function identifyAreasOfFocus(growthByCategory: any): string[] {
  // Identify categories with lowest growth for focus recommendations
  return Object.entries(growthByCategory)
    .sort(([, a]: any, [, b]: any) => a.current - b.current)
    .slice(0, 3)
    .map(([category]) => category)
}

function generateInsights(analytics: any): any {
  const insights = {
    strengths: [],
    areas_for_improvement: [],
    recommendations: [],
    trends: []
  }

  // Analyze engagement
  if (analytics.engagement) {
    if (analytics.engagement.engagement_score > 70) {
      insights.strengths.push('Excellent engagement and consistency')
    } else if (analytics.engagement.engagement_score < 30) {
      insights.areas_for_improvement.push('Increase daily engagement')
      insights.recommendations.push('Set daily reminders to check in with the app')
    }
  }

  // Analyze goals
  if (analytics.goals) {
    if (analytics.goals.completion_rate > 80) {
      insights.strengths.push('High goal completion rate')
    } else if (analytics.goals.completion_rate < 50) {
      insights.areas_for_improvement.push('Goal completion needs improvement')
      insights.recommendations.push('Break down goals into smaller, manageable tasks')
    }
  }

  // Analyze assessments
  if (analytics.assessments) {
    Object.entries(analytics.assessments.improvement_trends).forEach(([type, trend]: [string, any]) => {
      if (trend.improvement > 0) {
        insights.trends.push(`Positive improvement in ${type} assessment`)
      } else {
        insights.recommendations.push(`Focus on improving ${type} skills`)
      }
    })
  }

  // Analyze journal
  if (analytics.journal) {
    if (analytics.journal.consistency_percentage > 60) {
      insights.strengths.push('Consistent journaling habit')
    } else {
      insights.recommendations.push('Try to journal more regularly for better self-reflection')
    }
  }

  return insights
}