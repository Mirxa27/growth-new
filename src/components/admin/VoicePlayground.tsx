import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedVoiceInterface } from '@/components/chat/EnhancedVoiceInterface';

export const VoicePlayground: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>Voice Playground</CardTitle>
          <CardDescription>Try the realtime voice experience powered by your current configuration.</CardDescription>
        </CardHeader>
        <CardContent>
          <EnhancedVoiceInterface />
        </CardContent>
      </Card>
    </div>
  );
};
