import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { realtimeTranscriptionService, TranscriptionConfig } from '@/services/ai/realtime-transcription.service';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Trash2, 
  FileText,
  Loader2,
  Clock,
  Volume2,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TranscriptionResult {
  id: string;
  text: string;
  confidence: number;
  timestamp: Date;
  duration?: number;
  words?: {
    word: string;
    start: number;
    end: number;
    confidence: number;
  }[];
  isFinal: boolean;
}

interface TranscriptionPanelProps {
  config?: Partial<TranscriptionConfig>;
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  className?: string;
}

export const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({
  config = {},
  onTranscriptionComplete,
  className = ''
}) => {
  const { toast } = useToast();
  const [transcriptions, setTranscriptions] = useState<TranscriptionResult[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [language, setLanguage] = useState(config.language || 'en');
  const [enableWordTimestamps, setEnableWordTimestamps] = useState(config.enable_word_timestamps ?? true);

  const sessionIdRef = useRef<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
  ];

  /**
   * Generate session ID
   */
  const generateSessionId = useCallback(() => {
    return `transcription_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }, []);

  /**
   * Add transcription result
   */
  const addTranscription = useCallback((result: Omit<TranscriptionResult, 'id'>) => {
    const newResult: TranscriptionResult = {
      ...result,
      id: `trans_${Date.now()}_${Math.random().toString(36).substring(2)}`,
    };
    
    setTranscriptions(prev => [...prev, newResult]);
    onTranscriptionComplete?.(newResult);
    return newResult.id;
  }, [onTranscriptionComplete]);

  /**
   * Start transcription session
   */
  const startTranscription = useCallback(async () => {
    if (isConnected) return;

    try {
      const sessionId = generateSessionId();
      sessionIdRef.current = sessionId;

      const transcriptionConfig: Partial<TranscriptionConfig> = {
        ...config,
        language,
        enable_word_timestamps: enableWordTimestamps,
      };

      // Create transcription session
      await realtimeTranscriptionService.createTranscriptionSession(
        sessionId,
        transcriptionConfig,
        (transcript, isFinal) => {
          if (transcript.trim()) {
            addTranscription({
              text: transcript,
              confidence: 1.0, // Will be updated with actual confidence
              timestamp: new Date(),
              isFinal,
            });
          }
        },
        (error) => {
          console.error('Transcription error:', error);
          toast({
            title: 'Transcription Error',
            description: error,
            variant: 'destructive',
          });
        }
      );

      setIsConnected(true);
      setSessionDuration(0);

      // Start session timer
      sessionTimerRef.current = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);

      toast({
        title: 'Transcription Started',
        description: 'Ready to transcribe audio',
      });

    } catch (error) {
      console.error('Failed to start transcription:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to start transcription',
        variant: 'destructive',
      });
    }
  }, [isConnected, config, language, enableWordTimestamps, generateSessionId, addTranscription, toast]);

  /**
   * Stop transcription session
   */
  const stopTranscription = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      // Stop recording if active
      if (isRecording) {
        setIsRecording(false);
        mediaRecorderRef.current?.stop();
      }

      // Disconnect transcription session
      await realtimeTranscriptionService.disconnectTranscriptionSession(sessionIdRef.current);

      // Stop session timer
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }

      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setIsConnected(false);
      setSessionDuration(0);
      setAudioLevel(0);

      sessionIdRef.current = null;

      toast({
        title: 'Transcription Stopped',
        description: 'Session ended successfully',
      });

    } catch (error) {
      console.error('Failed to stop transcription:', error);
      toast({
        title: 'Error',
        description: 'Failed to stop transcription properly',
        variant: 'destructive',
      });
    }
  }, [isRecording, toast]);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async () => {
    if (!isConnected || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        } 
      });

      // Set up audio level monitoring
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        setAudioLevel((average / 255) * 100);
        
        if (isRecording) {
          requestAnimationFrame(updateAudioLevel);
        }
      };

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (sessionIdRef.current) {
          setIsTranscribing(true);
          try {
            // Convert blob to array buffer for transcription
            const arrayBuffer = await audioBlob.arrayBuffer();
            await realtimeTranscriptionService.sendAudioForTranscription(
              sessionIdRef.current,
              arrayBuffer
            );
            await realtimeTranscriptionService.commitTranscriptionBuffer(
              sessionIdRef.current
            );
          } catch (error) {
            console.error('Transcription failed:', error);
          } finally {
            setIsTranscribing(false);
          }
        }

        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
        setAudioLevel(0);
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      updateAudioLevel();

    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: 'Recording Failed',
        description: 'Failed to access microphone',
        variant: 'destructive',
      });
    }
  }, [isConnected, isRecording, toast]);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }, [isRecording]);

  /**
   * Clear transcriptions
   */
  const clearTranscriptions = useCallback(() => {
    setTranscriptions([]);
    toast({
      title: 'Transcriptions Cleared',
      description: 'All transcription history has been cleared',
    });
  }, [toast]);

  /**
   * Export transcriptions
   */
  const exportTranscriptions = useCallback(() => {
    const text = transcriptions
      .filter(t => t.isFinal)
      .map(t => `[${t.timestamp.toLocaleTimeString()}] ${t.text}`)
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Transcriptions exported to file',
    });
  }, [transcriptions, toast]);

  /**
   * Format time
   */
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (sessionIdRef.current) {
        stopTranscription();
      }
    };
  }, [stopTranscription]);

  return (
    <Card className={`transcription-panel h-[600px] flex flex-col ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Audio Transcription
            </CardTitle>
            <CardDescription>
              Real-time speech-to-text transcription
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {isConnected && (
              <Badge variant="outline" className="bg-blue-500 text-white">
                {formatTime(sessionDuration)}
              </Badge>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <Select value={language} onValueChange={setLanguage} disabled={isConnected}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="wordTimestamps"
              checked={enableWordTimestamps}
              onChange={(e) => setEnableWordTimestamps(e.target.checked)}
              disabled={isConnected}
            />
            <label htmlFor="wordTimestamps" className="text-sm">
              Word timestamps
            </label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isConnected ? (
            <Button
              onClick={startTranscription}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Transcription
            </Button>
          ) : (
            <>
              <Button
                onClick={stopTranscription}
                variant="destructive"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Session
              </Button>

              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "default"}
                disabled={isTranscribing}
                className={isRecording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
            </>
          )}

          <Button
            onClick={clearTranscriptions}
            variant="outline"
            disabled={transcriptions.length === 0}
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <Button
            onClick={exportTranscriptions}
            variant="outline"
            disabled={transcriptions.filter(t => t.isFinal).length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Audio Level */}
        {isRecording && (
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            <Progress value={audioLevel} className="flex-1" />
            <span className="text-sm w-12">{Math.round(audioLevel)}%</span>
          </div>
        )}

        {/* Transcription Status */}
        {isTranscribing && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing audio...</span>
          </div>
        )}

        {/* Transcriptions */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {transcriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transcriptions yet</p>
                <p className="text-sm">Start recording to see transcriptions here</p>
              </div>
            ) : (
              transcriptions.map((transcription) => (
                <div
                  key={transcription.id}
                  className={`p-3 rounded-lg border ${
                    transcription.isFinal 
                      ? 'bg-white border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm flex-1 ${
                      transcription.isFinal ? 'text-gray-900' : 'text-blue-800'
                    }`}>
                      {transcription.text}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {!transcription.isFinal && (
                        <Badge variant="outline" className="text-xs">
                          Processing
                        </Badge>
                      )}
                      <Clock className="w-3 h-3" />
                      <span>{transcription.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {transcription.confidence < 1 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Confidence: {Math.round(transcription.confidence * 100)}%
                      </span>
                      <Progress 
                        value={transcription.confidence * 100} 
                        className="h-1 flex-1" 
                      />
                    </div>
                  )}

                  {transcription.words && enableWordTimestamps && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <details>
                        <summary className="cursor-pointer hover:text-gray-600">
                          Word-level timestamps ({transcription.words.length} words)
                        </summary>
                        <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                          {transcription.words.map((word, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{word.word}</span>
                              <span>{word.start}s - {word.end}s</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Stats */}
        {transcriptions.length > 0 && (
          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>Total: {transcriptions.length} transcriptions</span>
            <span>Final: {transcriptions.filter(t => t.isFinal).length}</span>
            <span>Words: {transcriptions.reduce((acc, t) => acc + t.text.split(' ').length, 0)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TranscriptionPanel;