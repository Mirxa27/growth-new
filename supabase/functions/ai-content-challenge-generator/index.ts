import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateRequest {
  prompt: string
  type?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, type = 'challenge' }: GenerateRequest = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create AI prompt for challenge generation
    const systemPrompt = `You are an expert content creator specializing in personal development and wellness challenges. Generate engaging, achievable challenges that promote growth and well-being.

    For the user prompt, create a challenge with the following structure:
    - title: A compelling, motivational title (max 100 characters)
    - description: A detailed description explaining the challenge, its benefits, and how to complete it (200-500 words)
    - challenge_type: One of "completion", "streak", "community"
    - difficulty: One of "easy", "medium", "hard"
    - reward: A number between 10-100 representing points earned

    Respond only with valid JSON in this exact format:
    {
      "title": "Challenge Title",
      "description": "Detailed description...",
      "challenge_type": "completion",
      "difficulty": "medium", 
      "reward": 50
    }`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to generate content with AI' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()
    const generatedContent = data.choices[0]?.message?.content

    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: 'No content generated' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    try {
      // Parse the AI-generated JSON
      const challenge = JSON.parse(generatedContent)
      
      // Validate the structure
      if (!challenge.title || !challenge.description || !challenge.challenge_type || !challenge.difficulty || !challenge.reward) {
        throw new Error('Invalid challenge structure')
      }

      return new Response(
        JSON.stringify(challenge),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('AI Response:', generatedContent)
      
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI-generated content' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Challenge generation error:', error)
    return new Response(
      JSON.stringify({ error: `Challenge generation failed: ${error.message}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})