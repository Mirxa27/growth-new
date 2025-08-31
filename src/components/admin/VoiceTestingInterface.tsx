import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Play, Square, MessageSquare } from 'lucide-react';

export const VoiceTestingInterface: React.FC = () => {
  // Placeholder state and functions
  const isRecording = false;
  const isPlaying = false;
  const transcript = "User: Hello, how are you?\nAI: I'm doing well, thank you! How can I help you today?";

  return (
    <Card className="glass-strong">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-6 w-6" /> Voice Testing</CardTitle>
        <CardDescription>
          Test the active voice agent configuration in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" className={`rounded-full h-20 w-20 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-primary'}`}>
            {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </Button>
          <Button size="lg" variant="outline" className="rounded-full h-20 w-20" disabled={!transcript || isPlaying}>
            <Play className="h-8 w-8" />
          </Button>
        </div>
        <div>
          <Label>Conversation Transcript</Label>
          <Textarea
            readOnly
            value={transcript}
            className="min-h-[200px] font-mono text-sm glass-input mt-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};