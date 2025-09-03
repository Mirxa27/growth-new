'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'

// Voice Agent component using OpenAI Realtime API
export function VoiceAgent() {
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [transcript, setTranscript] = useState('')
  
  const sessionRef = useRef<any>(null)
  const agentRef = useRef<any>(null)

  const initializeVoiceAgent = async () => {
    setIsLoading(true)
    
    try {
      // Dynamically import the Realtime API SDK
      const agentsModule = await import('@openai/agents')
      const realtimeModule = await import('@openai/agents-realtime')
      
      const RealtimeAgent = realtimeModule.RealtimeAgent || agentsModule.realtime?.RealtimeAgent
      const RealtimeSession = realtimeModule.RealtimeSession || agentsModule.realtime?.RealtimeSession
      
      if (!RealtimeAgent || !RealtimeSession) {
        throw new Error('Failed to import Realtime API components')
      }
      
      // Create the agent
      agentRef.current = new RealtimeAgent({
        name: 'All-App Assistant',
        instructions: `You are a helpful AI assistant for All-App, a comprehensive platform for assessments, quizzes, and courses. 
        You can help users:
        - Navigate and understand different assessments
        - Explain assessment results
        - Recommend suitable courses based on their interests
        - Answer questions about the platform
        - Guide them through taking assessments
        - Provide general support and encouragement
        
        Be friendly, supportive, and encouraging. Keep responses concise and clear.`,
      })

      // Create session
      sessionRef.current = new RealtimeSession(agentRef.current, {
        model: 'gpt-realtime',
      })

      // Get ephemeral token from API
      const response = await fetch('/api/realtime-token', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to get realtime token')
      }
      
      const { token } = await response.json()

      // Connect to session
      await sessionRef.current.connect({ apiKey: token })
      
      setIsConnected(true)
      setIsListening(true)
      toast.success('Voice assistant connected!')
      
    } catch (error) {
      console.error('Error initializing voice agent:', error)
      toast.error('Failed to connect voice assistant')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMute = () => {
    if (sessionRef.current) {
      setIsMuted(!isMuted)
      // Toggle mute on the session
      if (!isMuted) {
        sessionRef.current.pauseAudio()
      } else {
        sessionRef.current.resumeAudio()
      }
    }
  }

  const toggleListening = () => {
    if (!isConnected) {
      initializeVoiceAgent()
    } else {
      setIsListening(!isListening)
      if (sessionRef.current) {
        if (isListening) {
          sessionRef.current.pauseInput()
        } else {
          sessionRef.current.resumeInput()
        }
      }
    }
  }

  const disconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.disconnect()
      sessionRef.current = null
      agentRef.current = null
      setIsConnected(false)
      setIsListening(false)
      toast.info('Voice assistant disconnected')
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (sessionRef.current) {
        sessionRef.current.disconnect()
      }
    }
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <Volume2 className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            AI Voice Assistant
          </h3>
          <p className="text-gray-600">
            {isConnected 
              ? 'Voice assistant is ready. Click the microphone to start talking!'
              : 'Click the microphone to activate the voice assistant'}
          </p>
        </div>

        {/* Voice Indicator */}
        {isConnected && isListening && (
          <div className="flex justify-center mb-6">
            <div className="voice-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={toggleListening}
            disabled={isLoading}
            className={`p-4 rounded-full transition-all ${
              isListening 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>

          {isConnected && (
            <>
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all ${
                  isMuted 
                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>

              <button
                onClick={disconnect}
                className="px-6 py-3 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
              >
                Disconnect
              </button>
            </>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-2"></div>
            <p className="text-gray-600">Connecting to voice assistant...</p>
          </div>
        )}

        {/* Transcript Display (optional) */}
        {transcript && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>You said:</strong> {transcript}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 space-y-2 text-sm text-gray-600">
          <p><strong>How to use:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Click the microphone button to start</li>
            <li>Allow browser permissions for microphone and speaker</li>
            <li>Speak naturally - the assistant will respond</li>
            <li>Ask about assessments, courses, or get guidance</li>
          </ul>
        </div>
      </div>
    </div>
  )
}