import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { realtimeService, RealtimeConfig, RealtimeSessionState } from '@/services/ai/realtime.service';
import { logger } from '@/utils/logger';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff,
  MessageSquare,
  Settings,
  Activity,
  Loader2
} from 'lucide-react';

export interface VoiceAgentProps {
  config?: Partial<RealtimeConfig>;
  onSessionStart?: (sessionId: string) => void;
  onSessionEnd?: (sessionId: string, duration: number) => void;
  onMessage?: (message: string, type: 'user' | 'assistant') => void;
  onTranscript?: (transcript: string, type: 'user' | 'assistant') => void;
  onError?: (error: string) => void;
  className?: string;
}

interface AudioLevel {
  input: number;
  output: number;
}

export const VoiceAgent: React.FC<VoiceAgentProps> = ({
  config = {},
  onSessionStart,
  onSessionEnd,
  onMessage,
  onTranscript,
  onError,
  className = ''
}) => {
  const { toast } = useToast();
  const [sessionState, setSessionState] = useState<RealtimeSessionState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [audioLevels, setAudioLevels] = useState<AudioLevel>({ input: 0, output: 0 });
  const [connectionTime, setConnectionTime] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const sessionIdRef = useRef<string | null>(null);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);

  /**
   * Generate unique session ID
   */
  const generateSessionId = useCallback(() => {
    return `voice_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }, []);

  /**
   * Start voice session
   */
  const startSession = useCallback(async () => {
    if (sessionState?.status === 'connected' || isConnecting) return;

    try {
      setIsConnecting(true);
      const sessionId = generateSessionId();
      sessionIdRef.current = sessionId;

      logger.info(`Starting voice session: ${sessionId}`);

      // Create session
      const newSessionState = await realtimeService.createSession(sessionId, config);
      setSessionState(newSessionState);

      // Connect session
      await realtimeService.connectSession(sessionId);

      // Update state
      const updatedState = realtimeService.getSessionState(sessionId);
      if (updatedState) {
        setSessionState(updatedState);
        setMessageCount(updatedState.messageCount);
      }

      // Start connection timer
      startConnectionTimer();

      // Initialize audio monitoring
      await initializeAudioMonitoring();

      // Notify parent component
      onSessionStart?.(sessionId);

      toast({
        title: 'Voice Session Started',
        description: 'Connected to AI voice assistant',
      });

      logger.info(`Voice session started successfully: ${sessionId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start voice session';
      logger.error('Failed to start voice session', 'VoiceAgent', error);
      
      onError?.(errorMessage);
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  }, [sessionState, isConnecting, config, onSessionStart, onError, toast, generateSessionId]);

  /**
   * End voice session
   */
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current || !sessionState) return;

    try {
      logger.info(`Ending voice session: ${sessionIdRef.current}`);

      // Stop connection timer
      if (connectionTimerRef.current) {
        clearInterval(connectionTimerRef.current);
        connectionTimerRef.current = null;
      }

      // Disconnect session
      await realtimeService.disconnectSession(sessionIdRef.current);

      // Clean up audio monitoring
      cleanupAudioMonitoring();

      // Calculate session duration
      const duration = sessionState.startTime 
        ? Date.now() - sessionState.startTime.getTime()
        : 0;

      // Notify parent component
      onSessionEnd?.(sessionIdRef.current, duration);

      // Reset state
      setSessionState(null);
      setConnectionTime(0);
      setMessageCount(0);
      setAudioLevels({ input: 0, output: 0 });

      toast({
        title: 'Voice Session Ended',
        description: `Session duration: ${Math.round(duration / 1000)}s`,
      });

      sessionIdRef.current = null;
      logger.info('Voice session ended successfully');
    } catch (error) {
      logger.error('Failed to end voice session', 'VoiceAgent', error);
      toast({
        title: 'Error',
        description: 'Failed to end voice session properly',
        variant: 'destructive',
      });
    }
  }, [sessionState, onSessionEnd, toast]);

  /**
   * Send text message
   */
  const sendMessage = useCallback(async (message: string) => {
    if (!sessionIdRef.current || sessionState?.status !== 'connected') {
      toast({
        title: 'Not Connected',
        description: 'Please start a voice session first',
        variant: 'destructive',
      });
      return;
    }

    try {
      await realtimeService.sendMessage(sessionIdRef.current, message);
      onMessage?.(message, 'user');
      
      // Update message count
      const updatedState = realtimeService.getSessionState(sessionIdRef.current);
      if (updatedState) {
        setMessageCount(updatedState.messageCount);
      }

      logger.debug(`Sent message: ${message.substring(0, 50)}...`);
    } catch (error) {
      logger.error('Failed to send message', 'VoiceAgent', error);
      toast({
        title: 'Message Failed',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  }, [sessionState, onMessage, toast]);

  /**
   * Toggle microphone mute
   */
  const toggleMicrophone = useCallback(() => {
    setIsMuted(!isMuted);
    // TODO: Implement actual microphone muting in the session
    logger.debug(`Microphone ${isMuted ? 'unmuted' : 'muted'}`);
  }, [isMuted]);

  /**
   * Toggle speaker mute
   */
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerMuted(!isSpeakerMuted);
    // TODO: Implement actual speaker muting in the session
    logger.debug(`Speaker ${isSpeakerMuted ? 'unmuted' : 'muted'}`);
  }, [isSpeakerMuted]);

  /**
   * Start connection timer
   */
  const startConnectionTimer = useCallback(() => {
    connectionTimerRef.current = setInterval(() => {
      setConnectionTime(prev => prev + 1);
    }, 1000);
  }, []);

  /**
   * Initialize audio monitoring
   */
  const initializeAudioMonitoring = useCallback(async () => {
    try {
      // Get user media for audio monitoring
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      // Create audio context and analyser
      audioContextRef.current = new AudioContext();
      audioAnalyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(audioAnalyserRef.current);

      audioAnalyserRef.current.fftSize = 256;
      const bufferLength = audioAnalyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Monitor audio levels
      const monitorAudio = () => {
        if (!audioAnalyserRef.current) return;

        audioAnalyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const level = (average / 255) * 100;

        setAudioLevels(prev => ({ ...prev, input: level }));
        
        if (sessionState?.status === 'connected') {
          requestAnimationFrame(monitorAudio);
        }
      };

      monitorAudio();
    } catch (error) {
      logger.warn('Failed to initialize audio monitoring', error);
    }
  }, [sessionState]);

  /**
   * Clean up audio monitoring
   */
  const cleanupAudioMonitoring = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioAnalyserRef.current = null;
  }, []);

  /**
   * Format connection time
   */
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Get status color
   */
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }, []);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        endSession();
      }
      cleanupAudioMonitoring();
    };
  }, [endSession, cleanupAudioMonitoring]);

  return (
    <Card className={`voice-agent ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Voice Assistant
            </CardTitle>
            <CardDescription>
              AI-powered voice interaction
            </CardDescription>
          </div>
          
          {sessionState && (
            <Badge 
              variant="outline" 
              className={`${getStatusColor(sessionState.status)} text-white border-none`}
            >
              {sessionState.status}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Connection Controls */}
        <div className="flex items-center justify-center gap-4">
          {!sessionState || sessionState.status === 'disconnected' ? (
            <Button
              onClick={startSession}
              disabled={isConnecting}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Phone className="w-5 h-5 mr-2" />
                  Start Session
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={endSession}
              size="lg"
              variant="destructive"
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              End Session
            </Button>
          )}
        </div>

        {/* Session Info */}
        {sessionState && sessionState.status === 'connected' && (
          <div className="space-y-4">
            {/* Connection Time and Message Count */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Duration: {formatTime(connectionTime)}</span>
              <span>Messages: {messageCount}</span>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="sm"
                onClick={toggleMicrophone}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>

              <Button
                variant={isSpeakerMuted ? "destructive" : "outline"}
                size="sm"
                onClick={toggleSpeaker}
              >
                {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>

            {/* Audio Levels */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mic className="w-4 h-4" />
                <span>Input:</span>
                <Progress value={audioLevels.input} className="flex-1" />
                <span className="w-8 text-xs">{Math.round(audioLevels.input)}%</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Volume2 className="w-4 h-4" />
                <span>Output:</span>
                <Progress value={audioLevels.output} className="flex-1" />
                <span className="w-8 text-xs">{Math.round(audioLevels.output)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {sessionState?.status === 'error' && sessionState.errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{sessionState.errorMessage}</p>
          </div>
        )}

        {/* Quick Message Input */}
        {sessionState?.status === 'connected' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage("Hello, how are you?")}
              >
                Say Hello
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage("Can you help me with personal growth?")}
              >
                Ask for Help
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VoiceAgent;