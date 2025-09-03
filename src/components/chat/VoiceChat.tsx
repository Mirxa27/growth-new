import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { openaiService } from '@/services/ai/openai.service';

interface VoiceChatProps {
  onTranscript?: (text: string, isUser: boolean) => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({ onTranscript }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []);

  const getEphemeralToken = async () => {
    try {
      // Get the current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call edge function to get ephemeral token
      const { data, error } = await supabase.functions.invoke('get-realtime-token', {
        body: {}
      });

      if (error) throw error;
      return data.client_secret;
    } catch (error) {
      console.error('Failed to get ephemeral token:', error);
      throw error;
    }
  };

  const connect = async () => {
    try {
      // Check if OpenAI is configured
      if (!openaiService.isConfigured()) {
        toast({
          title: 'OpenAI Not Configured',
          description: 'Please configure your OpenAI API key in the admin settings.',
          variant: 'destructive',
        });
        return;
      }

      // Get ephemeral token
      const ephemeralKey = await getEphemeralToken();

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      pcRef.current = pc;

      // Set up to play remote audio from the model
      audioElementRef.current = document.createElement('audio');
      audioElementRef.current.autoplay = true;
      pc.ontrack = (e) => {
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = e.streams[0];
        }
      };

      // Add local audio track for microphone input
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = ms;
      pc.addTrack(ms.getTracks()[0]);

      // Set up data channel for sending and receiving events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      // Listen for server events
      dc.addEventListener('message', (e) => {
        const event = JSON.parse(e.data);
        handleServerEvent(event);
      });

      dc.addEventListener('open', () => {
        console.log('Data channel opened');
        // Send initial configuration
        sendClientEvent({
          type: 'session.update',
          session: {
            type: 'realtime',
            instructions: 'You are NewMe, a supportive AI companion focused on personal growth and mental wellness. Be warm, encouraging, and insightful.',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            }
          }
        });
      });

      // Start the session using SDP
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Failed to connect: ${sdpResponse.statusText}`);
      }

      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      setIsConnected(true);
      setIsRecording(true);
      toast({
        title: 'Connected',
        description: 'Voice chat is now active',
      });

    } catch (error) {
      console.error('Connection error:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect to voice chat',
        variant: 'destructive',
      });
    }
  };

  const disconnect = () => {
    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Close data channel
    if (dcRef.current) {
      dcRef.current.close();
      dcRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Clean up audio element
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }

    setIsConnected(false);
    setIsRecording(false);
    setAudioLevel(0);
  };

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const sendClientEvent = (event: any) => {
    if (dcRef.current && dcRef.current.readyState === 'open') {
      dcRef.current.send(JSON.stringify(event));
    }
  };

  const handleServerEvent = (event: any) => {
    console.log('Server event:', event);

    switch (event.type) {
      case 'conversation.item.created':
        if (event.item?.content?.[0]?.transcript) {
          const transcript = event.item.content[0].transcript;
          const isUser = event.item.role === 'user';
          onTranscript?.(transcript, isUser);
        }
        break;

      case 'response.audio_transcript.delta':
        if (event.delta) {
          onTranscript?.(event.delta, false);
        }
        break;

      case 'input_audio_buffer.speech_started':
        console.log('Speech started');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('Speech stopped');
        break;

      case 'error':
        console.error('Realtime API error:', event.error);
        toast({
          title: 'Voice Error',
          description: event.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        break;
    }
  };

  // Monitor audio levels
  useEffect(() => {
    if (!mediaStreamRef.current) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(mediaStreamRef.current);
    const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    scriptProcessor.onaudioprocess = () => {
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      const values = array.reduce((a, b) => a + b, 0);
      const average = values / array.length;
      setAudioLevel(Math.round(average));
    };

    return () => {
      scriptProcessor.disconnect();
      analyser.disconnect();
      microphone.disconnect();
      audioContext.close();
    };
  }, [mediaStreamRef.current]);

  return (
    <Card className="glass-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Voice Chat</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Volume2 className="h-4 w-4" />
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${Math.min(audioLevel, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={isConnected ? disconnect : connect}
          variant={isConnected ? 'destructive' : 'default'}
          size="lg"
          className="flex-1"
        >
          {isConnected ? (
            <>
              <PhoneOff className="h-4 w-4 mr-2" />
              End Call
            </>
          ) : (
            <>
              <Phone className="h-4 w-4 mr-2" />
              Start Voice Chat
            </>
          )}
        </Button>

        {isConnected && (
          <Button
            onClick={toggleMute}
            variant={isMuted ? 'destructive' : 'secondary'}
            size="lg"
          >
            {isMuted ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {isConnected && (
        <div className="mt-4 text-sm text-muted-foreground text-center">
          {isRecording ? 'Listening...' : 'Connecting...'}
        </div>
      )}
    </Card>
  );
};