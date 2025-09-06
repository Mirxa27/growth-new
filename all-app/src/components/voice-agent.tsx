'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'

// Performance optimized Voice Agent component using OpenAI Realtime API
export function VoiceAgent() {
  const [isConnected, setIsConnected] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  const sessionRef = useRef<any>(null)
  const agentRef = useRef<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUnmountedRef = useRef(false)

  // Cleanup function with comprehensive resource management
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (sessionRef.current) {
      try {
        sessionRef.current.disconnect()
      } catch (error) {
        console.warn('Error during session cleanup:', error)
      }
      sessionRef.current = null
    }
    
    if (agentRef.current) {
      agentRef.current = null
    }
    
    setIsConnected(false)
    setIsListening(false)
    setIsLoading(false)
    setConnectionError(null)
  }, [])

  // Optimized agent initialization with retry logic
  const initializeVoiceAgent = useCallback(async (retryCount = 0) => {
    if (isUnmountedRef.current) return
    
    setIsLoading(true)
    setConnectionError(null)
    
    try {
      // Check for required APIs
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported in this browser')
      }

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })

      // Dynamically import the Realtime API SDK
      const [agentsModule, realtimeModule] = await Promise.all([
        import('@openai/agents').catch(() => null),
        import('@openai/agents-realtime').catch(() => null)
      ])
      
      const RealtimeAgent = realtimeModule?.RealtimeAgent || agentsModule?.realtime?.RealtimeAgent
      const RealtimeSession = realtimeModule?.RealtimeSession || agentsModule?.realtime?.RealtimeSession
      
      if (!RealtimeAgent || !RealtimeSession) {
        throw new Error('OpenAI Realtime API components not available')
      }
      
      // Create the agent with optimized configuration
      agentRef.current = new RealtimeAgent({
        name: 'All-App Assistant',
        instructions: `You are a helpful AI assistant for All-App, a comprehensive platform for assessments, quizzes, and courses. 
        You can help users:
        - Navigate and understand different assessments
        - Explain assessment results and recommendations
        - Recommend suitable courses based on their interests and strengths
        - Answer questions about the platform features
        - Guide them through taking assessments step by step
        - Provide general support and encouragement
        - Help with account and profile management
        
        Keep responses concise, clear, and supportive. Use a friendly, professional tone.
        If users ask about technical issues, guide them to contact support.`,
        model: 'gpt-4-realtime-preview',
        voice: 'alloy',
        temperature: 0.7,
        maxTokens: 150
      })

      // Create session with error handling
      sessionRef.current = new RealtimeSession(agentRef.current, {
        model: 'gpt-4-realtime-preview',
        modalities: ['text', 'audio'],
        instructions: agentRef.current.instructions
      })

      // Set up event listeners for better error handling
      sessionRef.current.on('error', (error: any) => {
        console.error('Voice session error:', error)
        setConnectionError('Connection error occurred')
        
        // Attempt reconnection for recoverable errors
        if (retryCount < 3 && !isUnmountedRef.current) {
          setTimeout(() => initializeVoiceAgent(retryCount + 1), 2000 * (retryCount + 1))
        }
      })

      sessionRef.current.on('disconnect', () => {
        if (!isUnmountedRef.current) {
          setIsConnected(false)
          setIsListening(false)
        }
      })

      sessionRef.current.on('transcript', (data: any) => {
        if (!isUnmountedRef.current && data.transcript) {
          setTranscript(data.transcript)
        }
      })

      // Get ephemeral token from API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('/api/realtime-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to get realtime token: ${response.status} ${errorText}`)
      }
      
      const { token } = await response.json()

      // Connect to session with timeout
      const connectionPromise = sessionRef.current.connect({ apiKey: token })
      const connectionTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 15000)
      )

      await Promise.race([connectionPromise, connectionTimeout])
      
      if (!isUnmountedRef.current) {
        setIsConnected(true)
        setIsListening(true)
        setConnectionError(null)
        toast.success('Voice assistant connected!')
      }
      
    } catch (error: any) {
      console.error('Error initializing voice agent:', error)
      
      if (!isUnmountedRef.current) {
        const errorMessage = error.name === 'NotAllowedError' 
          ? 'Microphone permission denied'
          : error.name === 'AbortError'
          ? 'Connection timed out'
          : 'Failed to connect voice assistant'
        
        setConnectionError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      if (!isUnmountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  // Optimized toggle functions with error handling
  const toggleMute = useCallback(() => {
    if (!sessionRef.current || !isConnected) return
    
    try {
      setIsMuted(prev => {
        const newMuted = !prev
        if (newMuted) {
          sessionRef.current.pauseAudio()
        } else {
          sessionRef.current.resumeAudio()
        }
        return newMuted
      })
    } catch (error) {
      console.error('Error toggling mute:', error)
      toast.error('Failed to toggle audio')
    }
  }, [isConnected])

  const toggleListening = useCallback(() => {
    if (!isConnected) {
      initializeVoiceAgent()
    } else if (sessionRef.current) {
      try {
        setIsListening(prev => {
          const newListening = !prev
          if (newListening) {
            sessionRef.current.resumeInput()
          } else {
            sessionRef.current.pauseInput()
          }
          return newListening
        })
      } catch (error) {
        console.error('Error toggling listening:', error)
        toast.error('Failed to toggle microphone')
      }
    }
  }, [isConnected, initializeVoiceAgent])

  const disconnect = useCallback(() => {
    cleanup()
    toast.info('Voice assistant disconnected')
  }, [cleanup])

  // Memoized button states for performance
  const buttonStates = useMemo(() => ({
    microphone: {
      disabled: isLoading,
      className: `p-4 rounded-full transition-all min-h-touch min-w-touch touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isListening 
          ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800' 
          : 'bg-gray-200 text-gray-600 hover:bg-gray-300 active:bg-gray-400'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`,
    },
    mute: {
      disabled: !isConnected,
      className: `p-4 rounded-full transition-all min-h-touch min-w-touch touch-manipulation focus:outline-none focus:ring-2 focus:ring-gray-500 ${
        isMuted 
          ? 'bg-red-100 text-red-600 hover:bg-red-200 active:bg-red-300' 
          : 'bg-gray-200 text-gray-600 hover:bg-gray-300 active:bg-gray-400'
      }`,
    }
  }), [isListening, isMuted, isLoading, isConnected])

  // Component unmount cleanup
  useEffect(() => {
    isUnmountedRef.current = false
    
    return () => {
      isUnmountedRef.current = true
      cleanup()
    }
  }, [cleanup])

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-full mb-4">
            <Volume2 className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">
            AI Voice Assistant
          </h3>
          <p className="text-gray-600 text-sm md:text-base max-w-md mx-auto">
            {connectionError ? (
              <span className="text-red-600">{connectionError}</span>
            ) : isConnected ? (
              'Voice assistant is ready. Click the microphone to start talking!'
            ) : (
              'Click the microphone to activate the voice assistant'
            )}
          </p>
        </div>

        {/* Voice Indicator with improved animation */}
        {isConnected && isListening && (
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-8 bg-blue-500 rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Controls with improved touch targets */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <button
            onClick={toggleListening}
            disabled={buttonStates.microphone.disabled}
            className={buttonStates.microphone.className}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? (
              <Mic className="w-6 h-6" aria-hidden="true" />
            ) : (
              <MicOff className="w-6 h-6" aria-hidden="true" />
            )}
          </button>

          {isConnected && (
            <>
              <button
                onClick={toggleMute}
                disabled={buttonStates.mute.disabled}
                className={buttonStates.mute.className}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-6 h-6" aria-hidden="true" />
                )}
              </button>

              <button
                onClick={disconnect}
                className="px-4 md:px-6 py-3 bg-red-100 text-red-600 rounded-full hover:bg-red-200 active:bg-red-300 transition-colors min-h-touch touch-manipulation focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Disconnect voice assistant"
              >
                Disconnect
              </button>
            </>
          )}
        </div>

        {/* Loading State with better UX */}
        {isLoading && (
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-600 text-sm">Connecting to voice assistant...</p>
          </div>
        )}

        {/* Enhanced Transcript Display */}
        {transcript && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong className="text-blue-800">You said:</strong> {transcript}
            </p>
          </div>
        )}

        {/* Improved Instructions */}
        <div className="mt-8 space-y-3 text-sm text-gray-600">
          <p className="font-medium text-gray-800">How to use:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>Click the microphone button to start</li>
            <li>Allow browser permissions for microphone and speaker</li>
            <li>Speak naturally - the assistant will respond with voice</li>
            <li>Ask about assessments, courses, or get platform guidance</li>
            <li>Use mute to pause audio output temporarily</li>
          </ul>
          
          {!isConnected && !isLoading && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-xs">
                <strong>Note:</strong> Make sure your microphone is working and browser permissions are granted for the best experience.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}