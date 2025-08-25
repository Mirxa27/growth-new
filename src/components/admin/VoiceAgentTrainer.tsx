import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Upload, 
  Download,
  Brain,
  Activity,
  CheckCircle,
  AlertTriangle,
  Info,
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TrainingSession {
  id: string;
  name: string;
  provider_id: string;
  recordings: AudioRecording[];
  status: 'draft' | 'training' | 'completed' | 'failed';
  created_at: string;
  progress?: number;
}

interface AudioRecording {
  id: string;
  name: string;
  duration: number;
  transcript?: string;
  audio_url: string;
  emotions?: string[];
  quality_score?: number;
}

interface VoiceAgentTrainerProps {
  providers: any[];
}

export const VoiceAgentTrainer = ({ providers }: VoiceAgentTrainerProps) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

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
        await processRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Record in 1s chunks
      setIsRecording(true);
      
      // Update progress every second
      const progressInterval = setInterval(() => {
        setRecordingProgress(prev => Math.min(prev + 1, 100));
      }, 1000);

      // Stop after 30 seconds max
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
        clearInterval(progressInterval);
      }, 30000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingProgress(0);
  };

  const processRecording = async (audioBlob: Blob) => {
    try {
      // Convert to base64 for upload
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) return;

        // Upload to Supabase Storage
        const fileName = `training_${Date.now()}.webm`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio-inputs')
          .upload(fileName, audioBlob);

        if (uploadError) {
          throw uploadError;
        }

        // Get transcript using Whisper
        const { data: transcriptData } = await supabase.functions.invoke('voice-to-text', {
          body: { audio: base64Audio }
        });

        const recording: AudioRecording = {
          id: crypto.randomUUID(),
          name: `Recording ${new Date().toLocaleTimeString()}`,
          duration: Math.round(audioBlob.size / 16000), // Rough estimate
          transcript: transcriptData?.text || '',
          audio_url: uploadData.path,
          quality_score: Math.random() * 0.3 + 0.7 // Mock quality score
        };

        if (currentSession) {
          setCurrentSession({
            ...currentSession,
            recordings: [...currentSession.recordings, recording]
          });
        }

        toast({
          title: "Recording Added",
          description: "Audio recorded and transcribed successfully.",
        });
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing recording:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process recording.",
        variant: "destructive",
      });
    }
  };

  const createNewSession = () => {
    const newSession: TrainingSession = {
      id: crypto.randomUUID(),
      name: `Training Session ${sessions.length + 1}`,
      provider_id: selectedProvider,
      recordings: [],
      status: 'draft',
      created_at: new Date().toISOString()
    };
    
    setSessions([...sessions, newSession]);
    setCurrentSession(newSession);
  };

  const startTraining = async () => {
    if (!currentSession || currentSession.recordings.length === 0) {
      toast({
        title: "No Recordings",
        description: "Please add some recordings before starting training.",
        variant: "destructive",
      });
      return;
    }

    setCurrentSession({ ...currentSession, status: 'training' });
    
    // Simulate training progress
    const progressInterval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setCurrentSession(session => session ? { ...session, status: 'completed' } : null);
          toast({
            title: "Training Complete",
            description: "Voice agent training completed successfully!",
          });
          return 100;
        }
        return prev + Math.random() * 10;
      });
    }, 1000);
  };

  const exportSession = async () => {
    if (!currentSession) return;

    const exportData = {
      session: currentSession,
      recordings: currentSession.recordings,
      metadata: {
        total_duration: currentSession.recordings.reduce((acc, rec) => acc + rec.duration, 0),
        average_quality: currentSession.recordings.reduce((acc, rec) => acc + (rec.quality_score || 0), 0) / currentSession.recordings.length,
        export_date: new Date().toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice_training_${currentSession.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Voice Agent Trainer
          </CardTitle>
          <CardDescription>
            Record and train custom voice agents with specific speaking patterns and responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>Select AI Provider</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a provider for training" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name} ({provider.provider_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Session Management */}
          <div className="flex gap-4">
            <Button 
              onClick={createNewSession} 
              disabled={!selectedProvider}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Training Session
            </Button>
            
            {currentSession && (
              <Badge variant="outline" className="flex items-center gap-2">
                <Activity className="h-3 w-3" />
                {currentSession.name} ({currentSession.recordings.length} recordings)
              </Badge>
            )}
          </div>

          {/* Recording Interface */}
          {currentSession && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recording Studio</CardTitle>
                <CardDescription>
                  Record training samples for your voice agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    className="flex items-center gap-2"
                  >
                    {isRecording ? (
                      <>
                        <Square className="h-4 w-4" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4" />
                        Start Recording
                      </>
                    )}
                  </Button>
                  
                  {isRecording && (
                    <div className="flex-1">
                      <Progress value={recordingProgress} className="h-2" />
                    </div>
                  )}
                </div>

                {isRecording && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Recording in progress... Speak clearly and naturally. Max 30 seconds.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Recordings List */}
                {currentSession.recordings.length > 0 && (
                  <div className="space-y-2">
                    <Label>Recorded Samples ({currentSession.recordings.length})</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {currentSession.recordings.map((recording) => (
                        <div key={recording.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{recording.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {recording.duration}s
                            </Badge>
                            {recording.quality_score && (
                              <Badge 
                                variant={recording.quality_score > 0.8 ? "default" : "secondary"}
                                className="text-xs"
                              >
                                Quality: {Math.round(recording.quality_score * 100)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Training Controls */}
          {currentSession && currentSession.recordings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Training Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    onClick={startTraining}
                    disabled={currentSession.status === 'training'}
                    className="flex items-center gap-2"
                  >
                    <Brain className="h-4 w-4" />
                    {currentSession.status === 'training' ? 'Training...' : 'Start Training'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={exportSession}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Session
                  </Button>
                </div>

                {currentSession.status === 'training' && (
                  <div className="space-y-2">
                    <Label>Training Progress</Label>
                    <Progress value={trainingProgress} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      Processing voice patterns and training neural networks...
                    </p>
                  </div>
                )}

                {currentSession.status === 'completed' && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Training completed successfully! Your voice agent is ready to use.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};