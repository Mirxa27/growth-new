import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw } from 'lucide-react';

type SessionInfo = {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string | null;
  metadata?: Record<string, any>;
};

export const AdminRealtimeMonitor: React.FC = () => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const resp = await fetch('/functions/v1/realtime-voice-session');
      // In a full implementation, this would list sessions from DB. For now just no-op.
      if (!resp.ok) {
        setSessions([]);
      } else {
        setSessions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Realtime Sessions
          <Badge variant="outline" className="ml-2">Live</Badge>
        </CardTitle>
        <CardDescription>Monitor active voice-to-voice sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">{sessions.length} sessions</div>
          <Button variant="outline" size="sm" onClick={fetchSessions} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        {sessions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No active sessions</div>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => (
              <div key={s.id} className="glass p-3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{s.id}</div>
                  <div className="text-xs text-muted-foreground">{new Date(s.started_at).toLocaleString()}</div>
                </div>
                <Badge variant="secondary">Active</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

