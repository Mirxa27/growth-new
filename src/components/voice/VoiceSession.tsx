import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  Settings,
  Activity,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Services
import { webRTCVoice } from '@/services/webrtc/webrtc-voice.service';
import { STTPipeline } from '@/services/webrtc/stt-pipeline.service';
import { TTSPipeline } from '@/services/webrtc/tts-pipeline.service';
import { openaiService } from '@/services/ai/openai.service';
import { supabase } from '@/integrations/supabase/client';

interface VoiceSessionProps {
  sessionId?: string;
  userId: string;
  config?: {
    language?: string;
    voiceId?: string;
    model?: string;
    systemPrompt?: string;
    enableTranscription?: boolean;
    enableVAD?: boolean;
  };
  onTranscript?: (text: string, isUser: boolean) => void;
  onSessionEnd?: (sessionData: any) => void;
}

interface TranscriptEntry {
  id: string;
  text: string;
  speaker: 'user' | 'assistant';
  timestamp: Date;
  confidence?: number;
  isFinal: boolean;
}

export const VoiceSession: React.FC<VoiceSessionProps> = ({
  sessionId: initialSessionId,
  userId,
  config = {},
  onTranscript,
  onSessionEnd
}) => {
  const { toast } = useToast();
  
  // State
  const [sessionId] = useState(initialSessionId || `session-${Date.now()}`);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [metrics, setMetrics] = useState({
    latency: 0,
    packetsLost: 0,
    jitter: 0,
    duration: 0
  });
  
  // Refs
  const sttPipelineRef = useRef<STTPipeline | null>(null);
  const ttsPipelineRef = useRef<TTSPipeline | null>(null);
  const conversationContextRef = useRef<string[]>([]);
  const sessionStartTimeRef = useRef<Date | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize pipelines
  useEffect(() => {
    initializePipelines();
    
    return () => {
      cleanup();
    };
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [transcript]);

  /**
   * Initialize STT and TTS pipelines
   */
  const initializePipelines = async () => {
    try {
      // Initialize WebRTC
      await webRTCVoice.initialize({
        enableVAD: config.enableVAD !== false,
        audioConstraints: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      // Initialize STT
      sttPipelineRef.current = new STTPipeline({
        provider: 'browser', // Use browser for lower latency, fallback to OpenAI
        language: config.language || 'en-US',
        continuous: true,
        interimResults: true
      });

      // Initialize TTS
      ttsPipelineRef.current = new TTSPipeline({
        provider: 'openai',
        voice: config.voiceId || 'nova',
        model: 'tts-1',
        streamingEnabled: true
      });

      // Set up event listeners
      setupEventListeners();
      
    } catch (error) {
      console.error('Failed to initialize pipelines:', error);
      toast({
        title: 'Initialization Error',
        description: 'Failed to initialize voice components. Please check your microphone permissions.',
        variant: 'destructive'
      });
      setConnectionState('error');
    }
  };

  /**
   * Set up event listeners
   */
  const setupEventListeners = () => {
    // WebRTC events
    webRTCVoice.on('initialized', () => {
      console.log('WebRTC initialized');
    });

    webRTCVoice.on('audioData', handleAudioData);
    webRTCVoice.on('connectionStateChange', handleConnectionStateChange);
    webRTCVoice.on('speechStart', handleSpeechStart);
    webRTCVoice.on('speechEnd', handleSpeechEnd);
    webRTCVoice.on('error', handleWebRTCError);

    // STT events
    if (sttPipelineRef.current) {
      sttPipelineRef.current.on('transcription', handleTranscription);
      sttPipelineRef.current.on('error', handleSTTError);
    }

    // TTS events
    if (ttsPipelineRef.current) {
      ttsPipelineRef.current.on('synthesized', handleSynthesized);
      ttsPipelineRef.current.on('speakingStart', () => setIsSpeakerMuted(false));
      ttsPipelineRef.current.on('speakingEnd', () => setIsSpeakerMuted(true));
      ttsPipelineRef.current.on('error', handleTTSError);
    }
  };

  /**
   * Handle audio data from WebRTC
   */
  const handleAudioData = useCallback((audioChunk: any) => {
    // Update audio level
    setAudioLevel(Math.round(audioChunk.energy * 100));

    // Process with STT if recording
    if (isRecording && sttPipelineRef.current) {
      sttPipelineRef.current.processAudio(audioChunk.data, audioChunk.timestamp);
    }
  }, [isRecording]);

  /**
   * Handle connection state changes
   */
  const handleConnectionStateChange = (state: string) => {
    switch (state) {
      case 'connecting':
        setConnectionState('connecting');
        break;
      case 'connected':
        setConnectionState('connected');
        startMetricsCollection();
        break;
      case 'disconnected':
      case 'failed':
        setConnectionState('disconnected');
        stopMetricsCollection();
        break;
    }
  };

  /**
   * Handle speech start
   */
  const handleSpeechStart = () => {
    // Pause TTS when user starts speaking
    if (ttsPipelineRef.current?.getIsSpeaking()) {
      ttsPipelineRef.current.pause();
    }
  };

  /**
   * Handle speech end
   */
  const handleSpeechEnd = () => {
    // Resume TTS when user stops speaking
    if (ttsPipelineRef.current) {
      ttsPipelineRef.current.resume();
    }
  };

  /**
   * Handle transcription results
   */
  const handleTranscription = useCallback(async (result: any) => {
    if (result.isFinal) {
      // Add to transcript
      const entry: TranscriptEntry = {
        id: `transcript-${Date.now()}`,
        text: result.text,
        speaker: 'user',
        timestamp: new Date(),
        confidence: result.confidence,
        isFinal: true
      };
      
      setTranscript(prev => [...prev, entry]);
      setInterimTranscript('');
      
      // Add to conversation context
      conversationContextRef.current.push(`User: ${result.text}`);
      
      // Notify parent
      onTranscript?.(result.text, true);
      
      // Process with AI
      await processWithAI(result.text);
      
    } else {
      // Update interim transcript
      setInterimTranscript(result.text);
    }
  }, [onTranscript]);

  /**
   * Process user input with AI
   */
  const processWithAI = async (userInput: string) => {
    try {
      // Build conversation history
      const messages = [
        {
          role: 'system' as const,
          content: config.systemPrompt || 'You are a helpful voice assistant. Keep responses concise and conversational.'
        },
        ...conversationContextRef.current.slice(-10).map(text => {
          const [role, content] = text.split(': ');
          return {
            role: role.toLowerCase() === 'user' ? 'user' as const : 'assistant' as const,
            content
          };
        }),
        {
          role: 'user' as const,
          content: userInput
        }
      ];

      // Get AI response
      const response = await openaiService.createChatCompletion({
        model: config.model || 'gpt-4-turbo-preview',
        messages,
        temperature: 0.7,
        max_tokens: 150, // Keep responses short for voice
        stream: true
      });

      let fullResponse = '';
      let currentSentence = '';
      
      // Process streaming response
      for await (const chunk of response) {
        if (chunk.choices[0]?.delta?.content) {
          const content = chunk.choices[0].delta.content;
          fullResponse += content;
          currentSentence += content;
          
          // Check for sentence end
          if (/[.!?]/.test(content)) {
            // Synthesize complete sentence
            if (ttsPipelineRef.current && currentSentence.trim()) {
              ttsPipelineRef.current.synthesize(currentSentence.trim(), {
                priority: 1
              });
            }
            currentSentence = '';
          }
        }
      }
      
      // Synthesize any remaining text
      if (ttsPipelineRef.current && currentSentence.trim()) {
        ttsPipelineRef.current.synthesize(currentSentence.trim(), {
          priority: 1
        });
      }
      
      // Add to transcript
      const aiEntry: TranscriptEntry = {
        id: `transcript-${Date.now()}`,
        text: fullResponse,
        speaker: 'assistant',
        timestamp: new Date(),
        isFinal: true
      };
      
      setTranscript(prev => [...prev, aiEntry]);
      setAiResponse(fullResponse);
      
      // Add to conversation context
      conversationContextRef.current.push(`Assistant: ${fullResponse}`);
      
      // Notify parent
      onTranscript?.(fullResponse, false);
      
    } catch (error) {
      console.error('AI processing error:', error);
      toast({
        title: 'AI Error',
        description: 'Failed to process your request. Please try again.',
        variant: 'destructive'
      });
    }
  };

  /**
   * Handle synthesized audio
   */
  const handleSynthesized = async (result: any) => {
    if (result.audio instanceof ArrayBuffer && ttsPipelineRef.current) {
      // Play the audio
      await ttsPipelineRef.current.playAudio(result.audio);
    }
  };

  /**
   * Handle errors
   */
  const handleWebRTCError = (error: any) => {
    console.error('WebRTC error:', error);
    setConnectionState('error');
  };

  const handleSTTError = (error: any) => {
    console.error('STT error:', error);
    if (error.type === 'recognition_error' && error.error === 'not-allowed') {
      toast({
        title: 'Microphone Access Denied',
        description: 'Please allow microphone access to use voice chat.',
        variant: 'destructive'
      });
    }
  };

  const handleTTSError = (error: any) => {
    console.error('TTS error:', error);
  };

  /**
   * Start voice session
   */
  const startSession = async () => {
    try {
      setConnectionState('connecting');
      sessionStartTimeRef.current = new Date();
      
      // Create WebRTC connection
      await webRTCVoice.createPeerConnection({
        sessionId,
        userId,
        language: config.language,
        voiceId: config.voiceId,
        model: config.model,
        systemPrompt: config.systemPrompt
      });
      
      // Start recording
      webRTCVoice.startRecording();
      setIsRecording(true);
      
      // Start STT
      sttPipelineRef.current?.start();
      
      // Store session in database
      await supabase.from('voice_sessions').insert({
        id: sessionId,
        user_id: userId,
        started_at: sessionStartTimeRef.current.toISOString(),
        config: {
          language: config.language,
          voice_id: config.voiceId,
          model: config.model
        },
        status: 'active'
      });
      
      setConnectionState('connected');
      
    } catch (error) {
      console.error('Failed to start session:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to start voice session. Please try again.',
        variant: 'destructive'
      });
      setConnectionState('error');
    }
  };

  /**
   * End voice session
   */
  const endSession = async () => {
    try {
      // Stop recording
      webRTCVoice.stopRecording();
      setIsRecording(false);
      
      // Stop STT
      sttPipelineRef.current?.stop();
      
      // Stop TTS
      ttsPipelineRef.current?.stop();
      
      // Disconnect WebRTC
      webRTCVoice.disconnect();
      
      // Calculate session duration
      const duration = sessionStartTimeRef.current 
        ? (Date.now() - sessionStartTimeRef.current.getTime()) / 1000 
        : 0;
      
      // Update session in database
      await supabase
        .from('voice_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration,
          transcript: transcript.map(t => ({
            text: t.text,
            speaker: t.speaker,
            timestamp: t.timestamp
          })),
          status: 'completed'
        })
        .eq('id', sessionId);
      
      // Notify parent
      onSessionEnd?.({
        sessionId,
        duration,
        transcript,
        metrics
      });
      
      setConnectionState('disconnected');
      
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  /**
   * Toggle mute
   */
  const toggleMute = () => {
    if (isMuted) {
      webRTCVoice.unmute();
      setIsMuted(false);
    } else {
      webRTCVoice.mute();
      setIsMuted(true);
    }
  };

  /**
   * Start metrics collection
   */
  const startMetricsCollection = () => {
    metricsIntervalRef.current = setInterval(async () => {
      const stats = await webRTCVoice.getAudioStats();
      if (stats) {
        setMetrics({
          latency: Math.round(stats.remote.jitter * 1000) || 0,
          packetsLost: stats.remote.packetsLost || 0,
          jitter: stats.remote.jitter || 0,
          duration: sessionStartTimeRef.current 
            ? Math.floor((Date.now() - sessionStartTimeRef.current.getTime()) / 1000)
            : 0
        });
      }
    }, 1000);
  };

  /**
   * Stop metrics collection
   */
  const stopMetricsCollection = () => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }
  };

  /**
   * Cleanup
   */
  const cleanup = () => {
    stopMetricsCollection();
    webRTCVoice.disconnect();
    sttPipelineRef.current?.destroy();
    ttsPipelineRef.current?.destroy();
  };

  /**
   * Format duration
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full h-full flex flex-col glass-panel">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Voice Session</h2>
            <Badge variant={connectionState === 'connected' ? 'success' : 'secondary'}>
              {connectionState === 'connected' ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  Connected
                </>
              ) : connectionState === 'connecting' ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Connecting
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span>{formatDuration(metrics.duration)}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{metrics.latency}ms</span>
          </div>
        </div>
      </div>

      {/* Transcript Area */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 p-4"
      >
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {transcript.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex gap-3",
                  entry.speaker === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    entry.speaker === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm">{entry.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs opacity-70">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                    {entry.confidence && (
                      <span className="text-xs opacity-70">
                        {Math.round(entry.confidence * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Interim transcript */}
            {interimTranscript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                className="flex justify-end"
              >
                <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-primary/50 text-primary-foreground italic">
                  <p className="text-sm">{interimTranscript}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Audio Level Indicator */}
      <div className="px-4 py-2 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <Progress value={audioLevel} className="flex-1" />
          <span className="text-xs text-muted-foreground">{audioLevel}%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center justify-center gap-4">
          {connectionState === 'disconnected' ? (
            <Button
              onClick={startSession}
              size="lg"
              className="gap-2"
            >
              <Phone className="w-5 h-5" />
              Start Call
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleMute}
                variant={isMuted ? 'destructive' : 'secondary'}
                size="icon"
                className="rounded-full w-12 h-12"
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
              
              <Button
                onClick={endSession}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                End Call
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full w-12 h-12"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
        
        {/* Status Messages */}
        {connectionState === 'error' && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>Connection error. Please try again.</span>
          </div>
        )}
      </div>
    </Card>
  );
};