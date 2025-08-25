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
  Play, 
  Volume2, 
  RefreshCw,
  TestTube,
  CheckCircle,
  AlertTriangle,
  Info,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceTestingProps {
  providers: any[];
}

export const VoiceTestingInterface = ({ providers }: VoiceTestingProps) => {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [testText, setTestText] = useState('Hello! This is a test of the voice-to-voice system. How does this sound?');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [fetchingData, setFetchingData] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const selectedProviderData = providers.find(p => p.id === selectedProvider);

  const fetchProviderData = async () => {
    if (!selectedProviderData) return;

    setFetchingData(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-ai-providers-data', {
        body: {
          provider_type: selectedProviderData.provider_type,
          api_key: 'test_key', // In real implementation, get from secure store
          endpoint_url: selectedProviderData.endpoint_url
        }
      });

      if (error) throw error;

      if (data.success) {
        // Update provider with fetched models and voices
        toast({
          title: "Data Fetched Successfully",
          description: `Found ${data.models?.length || 0} models and ${data.voices?.length || 0} voices`,
        });

        // You could update the provider data here if needed
        console.log('Fetched data:', data);
      }
    } catch (error: any) {
      toast({
        title: "Failed to Fetch Provider Data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFetchingData(false);
    }
  };

  const runVoiceTest = async () => {
    if (!selectedProvider || !selectedVoice || !testText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a provider, voice, and enter test text.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('test-voice-to-voice', {
        body: {
          provider_type: selectedProviderData.provider_type,
          api_key: 'test_key', // In real implementation, get from secure store
          model: selectedModel || selectedProviderData.available_models?.[0],
          voice: selectedVoice,
          test_text: testText,
          endpoint_url: selectedProviderData.endpoint_url
        }
      });

      if (error) throw error;

      setTestResult(data);
      
      if (data.success && data.audio_data) {
        // Create audio URL from base64 data
        const audioBlob = new Blob([
          Uint8Array.from(atob(data.audio_data), c => c.charCodeAt(0))
        ], { type: `audio/${data.format || 'mp3'}` });
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        toast({
          title: "Voice Test Successful",
          description: `Generated ${data.duration_estimate}s of audio using ${data.voice_used}`,
        });
      } else {
        throw new Error(data.error || 'Voice test failed');
      }
    } catch (error: any) {
      toast({
        title: "Voice Test Failed",
        description: error.message,
        variant: "destructive",
      });
      setTestResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `voice_test_${Date.now()}.${testResult?.format || 'mp3'}`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Voice-to-Voice Testing
          </CardTitle>
          <CardDescription>
            Test voice synthesis capabilities of your configured AI providers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a provider" />
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

            {selectedProviderData && (
              <div className="space-y-2">
                <Label>Fetch Latest Data</Label>
                <Button
                  onClick={fetchProviderData}
                  disabled={fetchingData}
                  variant="outline"
                  className="w-full"
                >
                  {fetchingData ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Fetch Models & Voices
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Model and Voice Selection */}
          {selectedProviderData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProviderData.available_models?.map((model: string) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Voice</Label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProviderData.available_voices?.map((voice: string) => (
                      <SelectItem key={voice} value={voice.split(' - ')[1] || voice}>
                        {voice}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Test Text */}
          <div className="space-y-2">
            <Label>Test Text</Label>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to synthesize..."
              rows={3}
            />
          </div>

          {/* Test Button */}
          <Button
            onClick={runVoiceTest}
            disabled={testing || !selectedProvider || !selectedVoice}
            className="w-full bg-gradient-primary"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Testing Voice Synthesis...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Test Voice-to-Voice
              </>
            )}
          </Button>

          {/* Test Results */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {testResult.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Test Successful
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Test Failed
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {testResult.success ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Voice Used</Label>
                        <p>{testResult.voice_used}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Model Used</Label>
                        <p>{testResult.model_used}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Format</Label>
                        <p>{testResult.format}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Duration</Label>
                        <p>{testResult.duration_estimate}s</p>
                      </div>
                    </div>

                    {audioUrl && (
                      <div className="flex gap-2">
                        <Button onClick={playAudio} variant="outline" className="flex-1">
                          <Play className="h-4 w-4 mr-2" />
                          Play Audio
                        </Button>
                        <Button onClick={downloadAudio} variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <audio ref={audioRef} src={audioUrl} onEnded={() => {
                      toast({ title: "Audio playback completed" });
                    }} />
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{testResult.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This testing interface helps you verify voice synthesis quality and latency for your configured providers.
              Use different text samples to test various voice characteristics.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};