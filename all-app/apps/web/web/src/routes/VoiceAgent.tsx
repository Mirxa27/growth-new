import { useEffect, useState } from 'react'

export default function VoiceAgent() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        // Fetch ephemeral token from server
        const resp = await fetch('/api/realtime/token', { method: 'POST' })
        const data = await resp.json()
        const clientKey = data?.client_secret?.value
        if (!clientKey) throw new Error('Missing client key')

        // Dynamically import to avoid SSR issues
        const { RealtimeAgent, RealtimeSession } = await import('@openai/agents/realtime')

        const agent = new RealtimeAgent({
          name: 'Assistant',
          instructions: 'You are a helpful educational voice assistant.',
        })

        const session = new RealtimeSession(agent, { model: 'gpt-realtime' })
        await session.connect({ apiKey: clientKey })
      } catch (e: any) {
        setError(e?.message ?? 'Failed to start voice agent')
      }
    }
    run()
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Voice Agent</h1>
      <p>Grant microphone access to start talking.</p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}

