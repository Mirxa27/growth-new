/**
 * Transcription Page
 * Main page for real-time audio transcription features
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Zap, Shield, Globe, Clock, Download } from 'lucide-react';
import { RealtimeTranscription } from '@/components/transcription/RealtimeTranscription';
import { TranscriptionDemo } from '@/components/transcription/TranscriptionDemo';

const TranscriptionPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Powered by OpenAI Realtime API</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Real-time Transcription
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Convert speech to text instantly with advanced AI models. Perfect for meetings, interviews, lectures, and accessibility.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Real-time Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get instant transcriptions as you speak with minimal latency using advanced streaming technology.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Multi-language Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Transcribe in multiple languages including English, Spanish, French, German, Italian, and Portuguese.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                High Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Advanced AI models with confidence scoring and noise reduction for accurate transcriptions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="live">Live Transcription</TabsTrigger>
            <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-6">
            <RealtimeTranscription />
          </TabsContent>

          <TabsContent value="demo" className="mt-6">
            <TranscriptionDemo />
          </TabsContent>
        </Tabs>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Features</CardTitle>
            <CardDescription>
              Advanced capabilities powered by OpenAI's Realtime API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">AI Models</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">GPT-4o Transcribe</span>
                    <Badge variant="default">Streaming</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">GPT-4o Mini Transcribe</span>
                    <Badge variant="secondary">Fast</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Whisper-1</span>
                    <Badge variant="outline">Batch</Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Audio Features</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Voice Activity Detection</span>
                    <Badge variant="default">Auto</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Noise Reduction</span>
                    <Badge variant="secondary">Near/Far Field</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Audio Format</span>
                    <Badge variant="outline">PCM16</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Use Cases</CardTitle>
            <CardDescription>
              Perfect for various scenarios requiring real-time speech-to-text
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Meetings & Conferences', description: 'Live meeting minutes and notes' },
                { title: 'Interviews & Podcasts', description: 'Real-time interview transcription' },
                { title: 'Lectures & Education', description: 'Classroom and online learning support' },
                { title: 'Accessibility', description: 'Live captions for hearing impaired' },
                { title: 'Content Creation', description: 'Video and podcast subtitles' },
                { title: 'Legal & Medical', description: 'Professional documentation' },
                { title: 'Customer Service', description: 'Call center transcription' },
                { title: 'Voice Notes', description: 'Personal voice-to-text notes' }
              ].map((useCase, index) => (
                <div key={index} className="p-4 rounded-lg border bg-muted/5">
                  <h5 className="font-medium mb-2">{useCase.title}</h5>
                  <p className="text-xs text-muted-foreground">{useCase.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Data Handling</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Audio processed in real-time</li>
                  <li>• No permanent audio storage</li>
                  <li>• Transcripts stored locally</li>
                  <li>• User controls data retention</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Security Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Encrypted WebSocket connections</li>
                  <li>• Secure API authentication</li>
                  <li>• Client-side audio processing</li>
                  <li>• No server-side audio storage</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TranscriptionPage;