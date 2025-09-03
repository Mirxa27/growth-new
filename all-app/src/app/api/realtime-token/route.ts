import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // In production, you should validate the user and their permissions here
    // For now, we'll generate a token for any request
    
    const openAIApiKey = process.env.OPENAI_API_KEY
    
    if (!openAIApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Generate ephemeral client token
    const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-realtime',
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate token' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      token: data.client_secret.value,
      expires_at: data.client_secret.expires_at,
    })
  } catch (error) {
    console.error('Error generating realtime token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}