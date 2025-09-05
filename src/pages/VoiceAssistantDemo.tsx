import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedRealtimeVoiceAgent } from '@/components/voice/EnhancedRealtimeVoiceAgent';
import { AdvancedVoiceConfigPanel } from '@/components/admin/AdvancedVoiceConfigPanel';
import { 
  Brain, 
  Mic, 
  Settings, 
  Zap, 
  Shield, 
  CheckCircle,
  Volume2,
  MessageSquare
} from 'lucide-react';

const VoiceAssistantDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            OpenAI GPT Realtime Voice Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Experience the future of conversational AI with real-time voice interaction, 
            advanced configuration options, and seamless integration.
          </p>
          
          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              GPT Realtime
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Mic className="h-3 w-3" />
              Native Speech-to-Speech
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Sub-second Latency
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Voice Activity Detection
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Real-time Transcription
            </Badge>
          </div>
        </div>

        {/* Key Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass text-center">
            <CardContent className="pt-6">
              <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold">Advanced AI</h3>
              <p className="text-sm text-muted-foreground">
                Standardized GPT Realtime with audio streaming
              </p>
            </CardContent>
          </Card>

          <Card className="glass text-center">
            <CardContent className="pt-6">
              <Mic className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold">Real-time Voice</h3>
              <p className="text-sm text-muted-foreground">
                Native speech processing without STT/TTS pipeline
              </p>
            </CardContent>
          </Card>

          <Card className="glass text-center">
            <CardContent className="pt-6">
              <Settings className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold">Full Control</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive admin panel for configuration
              </p>
            </CardContent>
          </Card>

          <Card className="glass text-center">
            <CardContent className="pt-6">
              <Shield className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-semibold">Enterprise Ready</h3>
              <p className="text-sm text-muted-foreground">
                Secure, scalable, and production-ready
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Voice Assistant Interface */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-6 w-6" />
              Interactive Voice Assistant
            </CardTitle>
            <CardDescription>
              Start a conversation with NewMe, your AI companion for personal growth and empowerment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedRealtimeVoiceAgent />
          </CardContent>
        </Card>

        {/* Technical Implementation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Technical Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-medium">WebSocket Streaming</p>
                    <p className="text-sm text-muted-foreground">
                      Persistent, low-latency connection for real-time audio streaming
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-medium">Voice Activity Detection</p>
                    <p className="text-sm text-muted-foreground">
                      Smart detection of speech with configurable sensitivity
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-medium">Audio Worklet Processing</p>
                    <p className="text-sm text-muted-foreground">
                      Real-time audio processing using Web Audio API worklets
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-medium">Interruption Handling</p>
                    <p className="text-sm text-muted-foreground">
                      Natural conversation flow with interruption support
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Configuration Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-medium">AI Model Selection</p>
                    <p className="text-sm text-muted-foreground">
                      Choose between GPT-4o and GPT-4o Mini models
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-medium">Voice Characteristics</p>
                    <p className="text-sm text-muted-foreground">
                      Six distinct voices with customizable speed and tone
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-medium">Response Behavior</p>
                    <p className="text-sm text-muted-foreground">
                      Fine-tune temperature, penalties, and response format
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <div>
                    <p className="font-medium">Audio Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Configure formats, sample rates, and VAD parameters
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Configuration Panel */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Advanced Configuration Panel
            </CardTitle>
            <CardDescription>
              Comprehensive admin interface for customizing every aspect of the voice assistant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdvancedVoiceConfigPanel />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Built with OpenAI's GPT-4o Realtime API, React, TypeScript, and Supabase
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantDemo;
