/**
 * Transcription Demo Component
 * Interactive demo showcasing transcription capabilities
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Square, Download, Share2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  audioFile: string;
  expectedTranscript: string;
  useCase: string;
  language: string;
  duration: number;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'meeting',
    title: 'Business Meeting',
    description: 'Quarterly review discussion with multiple speakers',
    audioFile: '/demo-audio/meeting.mp3',
    expectedTranscript: 'Good morning everyone. Let\'s start with our quarterly review. Sales are up 15% this quarter...',
    useCase: 'Corporate meetings and conference calls',
    language: 'en',
    duration: 45
  },
  {
    id: 'interview',
    title: 'Job Interview',
    description: 'Technical interview with coding questions',
    audioFile: '/demo-audio/interview.mp3',
    expectedTranscript: 'Can you tell me about your experience with React and TypeScript?...',
    useCase: 'HR interviews and candidate screening',
    language: 'en',
    duration: 30
  },
  {
    id: 'lecture',
    title: 'Educational Lecture',
    description: 'University lecture on machine learning',
    audioFile: '/demo-audio/lecture.mp3',
    expectedTranscript: 'Today we\'ll discuss neural networks and deep learning architectures...',
    useCase: 'Educational content and online learning',
    language: 'en',
    duration: 60
  },
  {
    id: 'multilingual',
    title: 'Multilingual Content',
    description: 'Mixed English and Spanish conversation',
    audioFile: '/demo-audio/multilingual.mp3',
    expectedTranscript: 'Hello, how are you? Hola, ¿cómo estás? I\'m fine, thank you...',
    useCase: 'International business and translation',
    language: 'auto',
    duration: 25
  }
];

export const TranscriptionDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const { toast } = useToast();

  // Simulate real-time transcription
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTranscribing && isPlaying) {
      const words = selectedScenario.expectedTranscript.split(' ');
      const wordsPerSecond = words.length / selectedScenario.duration;
      
      interval = setInterval(() => {
        const currentWordIndex = Math.floor(currentTime * wordsPerSecond);
        const currentWords = words.slice(0, currentWordIndex + 1).join(' ');
        
        setTranscript(currentWords);
        setConfidence(0.85 + Math.random() * 0.1); // Simulate confidence between 85-95%
        
        if (currentWordIndex >= words.length - 1) {
          setIsTranscribing(false);
          setIsPlaying(false);
        }
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTranscribing, isPlaying, currentTime, selectedScenario]);

  // Simulate audio playback timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= selectedScenario.duration) {
            setIsPlaying(false);
            return selectedScenario.duration;
          }
          return newTime;
        });
      }, 100);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, selectedScenario.duration]);

  const handlePlay = () => {
    setIsPlaying(true);
    setIsTranscribing(true);
    
    if (currentTime >= selectedScenario.duration) {
      setCurrentTime(0);
      setTranscript('');
    }

    toast({
      title: 'Demo Started',
      description: `Playing ${selectedScenario.title} scenario`,
    });
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsTranscribing(false);
    setCurrentTime(0);
    setTranscript('');
  };

  const handleScenarioChange = (scenario: DemoScenario) => {
    handleStop();
    setSelectedScenario(scenario);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedScenario.id}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: 'Transcript has been downloaded',
    });
  };

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Transcription Demo</CardTitle>
          <CardDescription>
            Experience real-time transcription with different scenarios and use cases
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="demo">Live Demo</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-6">
          {/* Current Scenario */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedScenario.title}</CardTitle>
                  <CardDescription>{selectedScenario.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedScenario.language}</Badge>
                  <Badge variant="secondary">{selectedScenario.useCase}</Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Audio Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  {!isPlaying ? (
                    <Button onClick={handlePlay} size="lg" className="bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      Start Demo
                    </Button>
                  ) : (
                    <Button onClick={handlePause} size="lg" variant="outline">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  
                  <Button onClick={handleStop} variant="outline">
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>

                  {transcript && (
                    <>
                      <Button onClick={downloadTranscript} variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(selectedScenario.duration)}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-100"
                      style={{ width: `${(currentTime / selectedScenario.duration) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center justify-center gap-4">
                  <Badge variant={isTranscribing ? 'default' : 'secondary'}>
                    {isTranscribing ? 'Transcribing' : 'Ready'}
                  </Badge>
                  {confidence > 0 && (
                    <Badge variant="outline">
                      {Math.round(confidence * 100)}% confidence
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transcript Display */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] p-4 border rounded-lg bg-muted/5">
                {transcript ? (
                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed">
                      {transcript}
                      {isTranscribing && <span className="animate-pulse">|</span>}
                    </p>
                    {transcript && (
                      <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>Words: {transcript.split(' ').length}</span>
                        <span>Characters: {transcript.length}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Start the demo to see real-time transcription</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          {DEMO_SCENARIOS.map((scenario) => (
            <Card 
              key={scenario.id}
              className={`cursor-pointer transition-all ${
                selectedScenario.id === scenario.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleScenarioChange(scenario)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                    <CardDescription>{scenario.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{formatTime(scenario.duration)}</Badge>
                    <Badge variant="secondary">{scenario.language}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm"><strong>Use Case:</strong> {scenario.useCase}</p>
                  <p className="text-sm text-muted-foreground italic">
                    "{scenario.expectedTranscript.substring(0, 100)}..."
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Technical Info */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Capabilities Demonstrated</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Real-time speech-to-text conversion</li>
                <li>• Multiple speaker detection</li>
                <li>• Confidence scoring</li>
                <li>• Multi-language support</li>
                <li>• Noise reduction</li>
                <li>• Voice activity detection</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Export Options</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Plain text (.txt)</li>
                <li>• JSON format (.json)</li>
                <li>• SRT subtitles (.srt)</li>
                <li>• Word document (.docx)</li>
                <li>• PDF report (.pdf)</li>
                <li>• Share via link</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};