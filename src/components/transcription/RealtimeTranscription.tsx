/**
 * Realtime Transcription Component
 * React component for real-time audio transcription
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Square, Play, Settings, Download, AlertTriangle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  realtimeTranscriptionService, 
  TranscriptionConfig, 
  TranscriptionEvent,
  TranscriptionSession 
} from '@/services/transcription/realtime-transcription.service';
import { env } from '@/config/environment';

interface TranscriptItem {
  id: string;
  text: string;
  confidence: number;
  timestamp: number;
  isComplete: boolean;
}

export const RealtimeTranscription: React.FC = () => {
  const [session, setSession] = useState<TranscriptionSession | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [config, setConfig] = useState<TranscriptionConfig>({
    model: 'gpt-4o-transcribe',
    language: 'en',
    noiseReduction: 'near_field',
    includeLogprobs: true
  });
  const [showSettings, setShowSettings] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const { toast } = useToast();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Check if OpenAI API key is configured
  const isApiKeyConfigured = env.openai.apiKey && env.openai.apiKey !== 'your-openai-api-key-here';

  useEffect(() => {
    // Set up event listeners
    const handleTranscription = (event: TranscriptionEvent) => {
      if (event.type === 'delta' && event.delta) {
        setCurrentTranscript(prev => prev + event.delta);
      } else if (event.type === 'completed' && event.transcript) {
        // Add completed transcript to list
        const newTranscript: TranscriptItem = {
          id: event.itemId || `transcript_${Date.now()}`,
          text: event.transcript,
          confidence: event.confidence || 0.8,
          timestamp: Date.now(),
          isComplete: true
        };
        
        setTranscripts(prev => [...prev, newTranscript]);
        setCurrentTranscript(''); // Clear current transcript
      }
    };

    const handleError = (event: TranscriptionEvent) => {
      console.error('Transcription error:', event.error);
      toast({
        title: 'Transcription Error',
        description: event.error || 'An error occurred during transcription',
        variant: 'destructive'
      });
      setIsTranscribing(false);
    };

    const handleConnected = () => {
      toast({
        title: 'Connected',
        description: 'Real-time transcription is now active',
      });
    };

    const handleDisconnected = () => {
      setIsTranscribing(false);
      toast({
        title: 'Disconnected',
        description: 'Transcription session ended',
      });
    };

    const handleSessionStarted = (session: TranscriptionSession) => {
      setSession(session);
      setIsTranscribing(true);
    };

    const handleSessionEnded = () => {
      setSession(null);
      setIsTranscribing(false);
    };

    // Add event listeners
    realtimeTranscriptionService.on('transcription', handleTranscription);
    realtimeTranscriptionService.on('error', handleError);
    realtimeTranscriptionService.on('connected', handleConnected);
    realtimeTranscriptionService.on('disconnected', handleDisconnected);
    realtimeTranscriptionService.on('sessionStarted', handleSessionStarted);
    realtimeTranscriptionService.on('sessionEnded', handleSessionEnded);

    return () => {
      // Clean up event listeners
      realtimeTranscriptionService.off('transcription', handleTranscription);
      realtimeTranscriptionService.off('error', handleError);
      realtimeTranscriptionService.off('connected', handleConnected);
      realtimeTranscriptionService.off('disconnected', handleDisconnected);
      realtimeTranscriptionService.off('sessionStarted', handleSessionStarted);
      realtimeTranscriptionService.off('sessionEnded', handleSessionEnded);
    };
  }, [toast]);

  useEffect(() => {
    // Auto-scroll to bottom when new transcripts are added
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts, currentTranscript]);

  const startTranscription = async () => {
    try {
      await realtimeTranscriptionService.startTranscription(config);
    } catch (error) {
      console.error('Failed to start transcription:', error);
      toast({
        title: 'Failed to Start',
        description: error.message || 'Could not start transcription',
        variant: 'destructive'
      });
    }
  };

  const stopTranscription = async () => {
    try {
      await realtimeTranscriptionService.stopTranscription();
      setCurrentTranscript('');
    } catch (error) {
      console.error('Failed to stop transcription:', error);
    }
  };

  const clearTranscripts = () => {
    setTranscripts([]);
    setCurrentTranscript('');
  };

  const downloadTranscript = () => {
    const allText = transcripts.map(t => t.text).join(' ');
    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = () => {
    if (!session) return 'secondary';
    switch (session.status) {
      case 'connected': return 'success';
      case 'transcribing': return 'primary';
      case 'connecting': return 'warning';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = () => {
    if (!session) return 'Not connected';
    switch (session.status) {
      case 'connected': return 'Ready';
      case 'transcribing': return 'Transcribing';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      case 'disconnected': return 'Disconnected';
      default: return 'Unknown';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* API Key Warning */}
      {!isApiKeyConfigured && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>OpenAI API Key Required:</strong> To use real-time transcription, please configure your OpenAI API key in the environment variables. 
            <Button variant="link" className="p-0 ml-1 h-auto" asChild>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                Get API Key <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </Button>
            <br />
            Add <code>VITE_OPENAI_API_KEY</code> to your Vercel environment variables and redeploy.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Real-time Transcription
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor() as any}>
                {getStatusText()}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Settings Panel */}
          {showSettings && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg mb-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Model</label>
                <Select
                  value={config.model}
                  onValueChange={(value: any) => setConfig(prev => ({ ...prev, model: value }))}
                  disabled={isTranscribing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-transcribe">GPT-4o Transcribe</SelectItem>
                    <SelectItem value="gpt-4o-mini-transcribe">GPT-4o Mini</SelectItem>
                    <SelectItem value="whisper-1">Whisper-1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Language</label>
                <Select
                  value={config.language}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, language: value }))}
                  disabled={isTranscribing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Noise Reduction</label>
                <Select
                  value={config.noiseReduction || 'near_field'}
                  onValueChange={(value) => setConfig(prev => ({ 
                    ...prev, 
                    noiseReduction: value === 'null' ? null : value as any 
                  }))}
                  disabled={isTranscribing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="near_field">Near Field</SelectItem>
                    <SelectItem value="far_field">Far Field</SelectItem>
                    <SelectItem value="null">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-4">
            {!isTranscribing ? (
              <Button
                onClick={startTranscription}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
                disabled={!isApiKeyConfigured}
              >
                <Mic className="w-4 h-4 mr-2" />
                {isApiKeyConfigured ? 'Start Transcription' : 'API Key Required'}
              </Button>
            ) : (
              <Button
                onClick={stopTranscription}
                variant="destructive"
                size="lg"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Transcription
              </Button>
            )}

            <Button
              onClick={clearTranscripts}
              variant="outline"
              disabled={transcripts.length === 0 && !currentTranscript}
            >
              Clear
            </Button>

            <Button
              onClick={downloadTranscript}
              variant="outline"
              disabled={transcripts.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          {/* Audio Level Indicator */}
          {isTranscribing && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">Audio Level:</span>
                <Progress value={audioLevel} className="flex-1" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcription Display */}
      <Card>
        <CardHeader>
          <CardTitle>Transcription</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto p-4 border rounded-lg bg-muted/5">
            {transcripts.length === 0 && !currentTranscript ? (
              <div className="text-center text-muted-foreground py-12">
                <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start transcription to see real-time text appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transcripts.map((transcript) => (
                  <div
                    key={transcript.id}
                    className="p-3 rounded-lg bg-background border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant={transcript.confidence > 0.8 ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {Math.round(transcript.confidence * 100)}% confidence
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(transcript.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{transcript.text}</p>
                  </div>
                ))}
                
                {currentTranscript && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Badge variant="outline" className="text-xs mb-2">
                      Live
                    </Badge>
                    <p className="text-sm leading-relaxed">
                      {currentTranscript}
                      <span className="animate-pulse">|</span>
                    </p>
                  </div>
                )}
                
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      {session && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {Math.floor((Date.now() - session.startTime) / 1000)}s
                </div>
                <div className="text-xs text-muted-foreground">Duration</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {transcripts.length}
                </div>
                <div className="text-xs text-muted-foreground">Segments</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {session.config.model}
                </div>
                <div className="text-xs text-muted-foreground">Model</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {session.config.language?.toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">Language</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};