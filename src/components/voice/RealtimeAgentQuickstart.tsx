import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RealtimeAgent, RealtimeSession } from '@openai/agents-realtime';
import { supabase } from '@/integrations/supabase/client';

export default function RealtimeAgentQuickstart() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const sessionRef = useRef<RealtimeSession | null>(null);

  async function connect() {
    setConnecting(true);
    try {
      // Fetch ephemeral client secret from Supabase Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
      const resp = await fetch(`${supabaseUrl}/functions/v1/get-realtime-token`, { method: 'POST', headers });
      if (!resp.ok) throw new Error('Failed to get client token');
      const { client_secret } = await resp.json();
      if (!client_secret) throw new Error('Missing client secret');

      const agent = new RealtimeAgent({
        name: 'Assistant',
        instructions: 'You are a helpful assistant.',
      });

      const session = new RealtimeSession(agent, { model: 'gpt-realtime' });
      sessionRef.current = session;
      await session.connect({ apiKey: client_secret });
      setConnected(true);
    } catch (e) {
      console.error(e);
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  }

  async function disconnect() {
    try {
      await sessionRef.current?.disconnect?.();
    } finally {
      sessionRef.current = null;
      setConnected(false);
    }
  }

  useEffect(() => {
    return () => {
      sessionRef.current?.disconnect?.();
    };
  }, []);

  return (
    <Card className="glass-card border-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Realtime Agent
          <Badge variant={connected ? 'default' : 'secondary'}>
            {connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-x-2">
        {!connected ? (
          <Button disabled={connecting} onClick={connect}>Connect</Button>
        ) : (
          <Button variant="destructive" onClick={disconnect}>Disconnect</Button>
        )}
      </CardContent>
    </Card>
  );
}

