import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Play, Square, MessageSquare, AlertCircle } from 'lucide-react';
import { RealtimeVoiceChat } from '@/utils/RealtimeVoiceChat';
import { toast } from 'sonner';

export const VoiceTestingInterface: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const realtimeChatRef = useRef<RealtimeVoiceChat | null>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    return () => {
      if (realtimeChatRef.current) {
        realtimeChatRef.current.disconnect();
      }
    };
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      realtimeChatRef.current = new RealtimeVoiceChat(
        (message) => {
          console.log('Realtime message:', message);
        },
        (newTranscript, isFinal) => {
          if (isFinal) {
            transcriptRef.current += `User: ${newTranscript}\n`;
            setTranscript(transcriptRef.current);
          } else {
            // Update temporary transcript
            const tempTranscript = transcriptRef.current + `User: ${newTranscript}...\n`;
            setTranscript(tempTranscript);
          }
        },
        (speaking) => {
          setIsPlaying(speaking);
        }
      );

      await realtimeChatRef.current.connect();
      setIsConnected(true);
      toast.success('Connected to voice agent');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (realtimeChatRef.current) {
      realtimeChatRef.current.disconnect();
      realtimeChatRef.current = null;
    }
    setIsConnected(false);
    setIsRecording(false);
    setIsPlaying(false);
    toast.success('Disconnected from voice agent');
  };

  const handleStartRecording = async () => {
    if (!realtimeChatRef.current) return;
    
    try {
      await realtimeChatRef.current.startRecording();
      setIsRecording(true);
      transcriptRef.current += '\n--- Recording Started ---\n';
      setTranscript(transcriptRef.current);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleStopRecording = async () => {
    if (!realtimeChatRef.current) return;
    
    try {
      await realtimeChatRef.current.stopRecording();
      setIsRecording(false);
      transcriptRef.current += '\n--- Recording Stopped ---\n';
      setTranscript(transcriptRef.current);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleClearTranscript = () => {
    transcriptRef.current = '';
    setTranscript('');
  };

  return (
    <Card className="glass-strong">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" /> Voice Testing
        </CardTitle>
        <CardDescription>
          Test the active voice agent configuration in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-4">
          {!isConnected ? (
            <Button 
              size="lg" 
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-gradient-primary"
            >
              {isConnecting ? 'Connecting...' : 'Connect'}
            </Button>
          ) : (
            <>
              <Button 
                size="lg" 
                className={`rounded-full h-20 w-20 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-primary'}`}
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isConnecting}
              >
                {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-full h-20 w-20" 
                onClick={handleDisconnect}
                disabled={isPlaying}
              >
                <Square className="h-8 w-8" />
              </Button>
            </>
          )}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Conversation Transcript</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearTranscript}
              disabled={!transcript}
            >
              Clear
            </Button>
          </div>
          <Textarea
            readOnly
            value={transcript || 'Connect to voice agent to start testing...'}
            className="min-h-[200px] font-mono text-sm glass-input mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};