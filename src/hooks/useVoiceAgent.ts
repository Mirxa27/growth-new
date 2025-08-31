import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  VoiceSessionState, 
  VoiceMessage, 
  VoiceAgentConfig, 
  UseVoiceAgentReturn,
  ClientTokenResponse 
} from '@/types/voice';
import { useToast } from '@/hooks/use-toast';

// Use the standard WebRTC approach with OpenAI Realtime API
export const useVoiceAgent = (config: VoiceAgentConfig): UseVoiceAgentReturn => {
  const [state, setState] = useState<VoiceSessionState>({
    isConnected: false,
    isRecording: false,
    isSpeaking: false,
    transcript: '',
    error: null,
  });

  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Generate client token from Supabase
  const generateClientToken = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-voice-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate client token');
      }

      const data: ClientTokenResponse = await response.json();
      return data.client_secret.value;
    } catch (error) {
      console.error('Error generating client token:', error);
      throw error;
    }
  }, []);

  // Connect to voice session
  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const clientToken = await generateClientToken();
      
      // Create WebSocket connection to OpenAI Realtime API
      const ws = new WebSocket(`wss://api.openai.com/v1/realtime?model=${config.model || 'gpt-4o-realtime-preview-2024-10-01'}`, [
        'realtime-api',
        `openai-insecure-api-key.${clientToken}`
      ]);

      ws.onopen = () => {
        setState(prev => ({ ...prev, isConnected: true }));
        
        // Configure session
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: config.instructions,
            voice: config.voice || 'alloy',
            temperature: config.temperature || 0.7,
            max_tokens: config.maxTokens || 1000,
          }
        }));

        toast({
          title: "Connected",
          description: "Voice agent is ready",
        });
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'conversation.item.created':
            if (data.item.type === 'message') {
              const newMessage: VoiceMessage = {
                id: data.item.id,
                type: data.item.role === 'user' ? 'user' : 'assistant',
                content: data.item.content?.[0]?.text || '',
                timestamp: new Date(),
              };
              
              setMessages(prev => [...prev, newMessage]);
            }
            break;
            
          case 'response.audio_transcript.delta':
            if (data.delta) {
              setState(prev => ({ ...prev, transcript: data.delta }));
            }
            break;
            
          case 'response.audio.start':
            setState(prev => ({ ...prev, isSpeaking: true }));
            break;
            
          case 'response.audio.done':
            setState(prev => ({ ...prev, isSpeaking: false }));
            break;
            
          case 'error':
            console.error('Voice session error:', data.error);
            setState(prev => ({ ...prev, error: data.error?.message || 'Unknown error' }));
            toast({
              title: "Voice Error",
              description: data.error?.message || 'An error occurred',
              variant: "destructive",
            });
            break;
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ ...prev, error: 'Connection error' }));
      };

      ws.onclose = () => {
        setState({
          isConnected: false,
          isRecording: false,
          isSpeaking: false,
          transcript: '',
          error: null,
        });
      };

      wsRef.current = ws;

    } catch (error) {
      console.error('Error connecting to voice session:', error);
      setState(prev => ({ ...prev, error: error.message }));
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [config, generateClientToken, toast]);

  // Disconnect from voice session
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setState({
      isConnected: false,
      isRecording: false,
      isSpeaking: false,
      transcript: '',
      error: null,
    });

    toast({
      title: "Disconnected",
      description: "Voice session ended",
    });
  }, [toast]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Error",
        description: "Not connected to voice agent",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const audioData = new Int16Array(inputData.length);
        
        for (let i = 0; i < inputData.length; i++) {
          audioData[i] = Math.max(-32768, Math.min(32767, Math.floor(inputData[i] * 32768)));
        }
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: btoa(String.fromCharCode(...new Uint8Array(audioData.buffer)))
          }));
        }
      };

      wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      wsRef.current.send(JSON.stringify({ type: 'response.create' }));
      
      setState(prev => ({ ...prev, isRecording: true }));
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setState(prev => ({ ...prev, isRecording: false }));
  }, []);

  // Send text message
  const sendTextMessage = useCallback((message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: message
          }]
        }
      }));
    }
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    messages,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendTextMessage,
    clearMessages,
  };
};
