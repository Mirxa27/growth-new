import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceAgentConfigManager } from '@/components/admin/VoiceAgentConfigManager';
import AIContentBuilder from '@/components/admin/AIContentBuilder';

const AdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your NewMe platform configuration and content
        </p>
      </div>

      <Tabs defaultValue="voice-config" className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="voice-config">Voice Agent</TabsTrigger>
          <TabsTrigger value="content-builder">Content Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="voice-config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VoiceAgentConfigManager />
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Voice Agent Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Features</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Real-time voice conversations</li>
                        <li>• Dynamic configuration management</li>
                        <li>• Multiple voice personalities</li>
                        <li>• Temperature and token control</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Quick Actions</h4>
                      <p className="text-sm text-muted-foreground">
                        Create and manage different voice agent configurations for various use cases.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content-builder" className="space-y-6">
          <AIContentBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;