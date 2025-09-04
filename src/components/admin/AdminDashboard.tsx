import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceAgentSettings } from '@/components/admin/VoiceAgentSettings';
import { GeneralSettings } from '@/components/admin/GeneralSettings';
import RealtimeVoiceClient from '../voice/RealtimeVoiceClient';
import { VoicePlayground } from './VoicePlayground';

const AdminDashboard: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <Tabs defaultValue="voice-agent">
        <TabsList>
          <TabsTrigger value="voice-agent">Voice Agent</TabsTrigger>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="live-preview">Live Preview</TabsTrigger>
          <TabsTrigger value="playground">Playground</TabsTrigger>
        </TabsList>
        <TabsContent value="voice-agent">
          <VoiceAgentSettings />
        </TabsContent>
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="live-preview">
          <RealtimeVoiceClient />
        </TabsContent>
        <TabsContent value="playground">
          <VoicePlayground />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;