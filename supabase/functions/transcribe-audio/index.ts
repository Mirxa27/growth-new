import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranscribeRequest {
  audioData: string // Base64 encoded audio data
  format?: string // audio format (webm, mp3, wav, etc.)
  language?: string // language code (en, ar, etc.)
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioData, format = 'webm', language = 'en' }: TranscribeRequest = await req.json()

    if (!audioData) {
      return new Response(
        JSON.stringify({ error: 'Audio data is required' }),
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

    // Convert base64 to binary
    let audioBuffer: ArrayBuffer
    try {
      // Remove data URL prefix if present
      const base64Data = audioData.replace(/^data:audio\/[^;]+;base64,/, '')
      audioBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid audio data format' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create form data for OpenAI Whisper API
    const formData = new FormData()
    const audioBlob = new Blob([audioBuffer], { type: `audio/${format}` })
    formData.append('file', audioBlob, `audio.${format}`)
    formData.append('model', 'whisper-1')
    formData.append('language', language)
    formData.append('response_format', 'json')

    // Call OpenAI Whisper API
    const transcribeResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    })

    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text()
      console.error('OpenAI Whisper API error:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: `Transcription failed: ${transcribeResponse.status} ${transcribeResponse.statusText}`,
          details: errorText
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const transcriptionData = await transcribeResponse.json()
    
    if (!transcriptionData.text) {
      return new Response(
        JSON.stringify({ error: 'No transcription text received' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        text: transcriptionData.text,
        language: transcriptionData.language,
        duration: transcriptionData.duration,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Audio transcription error:', error)
    return new Response(
      JSON.stringify({ error: `Transcription failed: ${error.message}` }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})