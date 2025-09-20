import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { realtimeService, RealtimeSessionState } from '@/services/ai/realtime.service';
import { realtimeWebSocketService, WebSocketRealtimeSession } from '@/services/ai/realtime-websocket.service';
import { realtimeTranscriptionService, TranscriptionSession } from '@/services/ai/realtime-transcription.service';
import { 
  Activity, 
  Clock, 
  MessageSquare, 
  Mic, 
  Volume2, 
  Trash2, 
  RefreshCw,
  Eye,
  Play,
  Square,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  totalDuration: number;
  totalMessages: number;
  averageSessionDuration: number;
}

export const SessionManager: React.FC = () => {
  const { toast } = useToast();
  const [realtimeSessions, setRealtimeSessions] = useState<RealtimeSessionState[]>([]);
  const [webSocketSessions, setWebSocketSessions] = useState<WebSocketRealtimeSession[]>([]);
  const [transcriptionSessions, setTranscriptionSessions] = useState<TranscriptionSession[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    activeSessions: 0,
    totalDuration: 0,
    totalMessages: 0,
    averageSessionDuration: 0,
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  /**
   * Refresh session data
   */
  const refreshSessions = useCallback(async () => {
    try {
      // Get Realtime sessions
      const realtimeActive = realtimeService.getActiveSessions();
      setRealtimeSessions(realtimeActive);

      // Get WebSocket sessions
      const webSocketActive = realtimeWebSocketService.getActiveSessions();
      setWebSocketSessions(webSocketActive);

      // Get Transcription sessions
      const transcriptionActive = realtimeTranscriptionService.getActiveTranscriptionSessions();
      setTranscriptionSessions(transcriptionActive);

      // Calculate stats
      const allSessions = [...realtimeActive, ...webSocketActive, ...transcriptionActive];
      const activeSessions = allSessions.filter(s => s.status === 'connected' || s.status === 'connecting');
      
      const totalDuration = allSessions.reduce((acc, session) => {
        if (session.startTime) {
          const endTime = session.endTime || new Date();
          return acc + (endTime.getTime() - session.startTime.getTime());
        }
        return acc;
      }, 0);

      const totalMessages = allSessions.reduce((acc, session) => {
        return acc + (('messageCount' in session) ? session.messageCount : ('transcriptCount' in session) ? session.transcriptCount : 0);
      }, 0);

      setStats({
        totalSessions: allSessions.length,
        activeSessions: activeSessions.length,
        totalDuration,
        totalMessages,
        averageSessionDuration: allSessions.length > 0 ? totalDuration / allSessions.length : 0,
      });

    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    }
  }, []);

  /**
   * Auto-refresh sessions
   */
  useEffect(() => {
    refreshSessions();
    
    if (autoRefresh) {
      const interval = setInterval(refreshSessions, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshSessions]);

  /**
   * Disconnect a session
   */
  const disconnectSession = useCallback(async (sessionId: string, type: 'realtime' | 'websocket' | 'transcription') => {
    try {
      switch (type) {
        case 'realtime':
          await realtimeService.disconnectSession(sessionId);
          break;
        case 'websocket':
          await realtimeWebSocketService.disconnectSession(sessionId);
          break;
        case 'transcription':
          await realtimeTranscriptionService.disconnectTranscriptionSession(sessionId);
          break;
      }

      toast({
        title: 'Session Disconnected',
        description: `${type} session ${sessionId} has been disconnected`,
      });

      refreshSessions();
    } catch (error) {
      console.error(`Failed to disconnect ${type} session:`, error);
      toast({
        title: 'Error',
        description: `Failed to disconnect ${type} session`,
        variant: 'destructive',
      });
    }
  }, [toast, refreshSessions]);

  /**
   * Clean up old sessions
   */
  const cleanupSessions = useCallback(async () => {
    try {
      realtimeService.cleanupSessions();
      realtimeWebSocketService.cleanupSessions();
      realtimeTranscriptionService.cleanupTranscriptionSessions();

      toast({
        title: 'Cleanup Complete',
        description: 'Old sessions have been cleaned up',
      });

      refreshSessions();
    } catch (error) {
      console.error('Failed to cleanup sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to cleanup sessions',
        variant: 'destructive',
      });
    }
  }, [toast, refreshSessions]);

  /**
   * Format duration
   */
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  /**
   * Render session card
   */
  const renderSessionCard = (
    session: RealtimeSessionState | WebSocketRealtimeSession | TranscriptionSession,
    type: 'realtime' | 'websocket' | 'transcription'
  ) => {
    const isActive = session.status === 'connected' || session.status === 'connecting';
    const duration = session.startTime ? 
      (session.endTime || new Date()).getTime() - session.startTime.getTime() : 0;
    const messageCount = ('messageCount' in session) ? session.messageCount : 
                        ('transcriptCount' in session) ? session.transcriptCount : 0;

    return (
      <Card key={session.id} className={`${isActive ? 'ring-2 ring-blue-500' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {type === 'realtime' && <Activity className="w-4 h-4" />}
              {type === 'websocket' && <MessageSquare className="w-4 h-4" />}
              {type === 'transcription' && <Mic className="w-4 h-4" />}
              {type.charAt(0).toUpperCase() + type.slice(1)} Session
            </CardTitle>
            <Badge 
              variant="outline" 
              className={`${getStatusColor(session.status)} text-white border-none text-xs`}
            >
              {session.status}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            ID: {session.id.substring(0, 16)}...
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Duration: {formatDuration(duration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              <span>Messages: {messageCount}</span>
            </div>
            <div className="col-span-2 text-muted-foreground">
              Started: {formatDistanceToNow(session.startTime)} ago
            </div>
          </div>

          {session.errorMessage && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
              {session.errorMessage}
            </div>
          )}

          <div className="flex gap-2">
            {isActive && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => disconnectSession(session.id, type)}
                className="text-xs"
              >
                <Square className="w-3 h-3 mr-1" />
                Disconnect
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // TODO: Implement session details view
                toast({
                  title: 'Session Details',
                  description: `Viewing details for ${type} session ${session.id}`,
                });
              }}
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Session Overview
          </CardTitle>
          <CardDescription>
            Real-time statistics for all voice and transcription sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.activeSessions}</div>
              <div className="text-sm text-muted-foreground">Active Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalSessions}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalMessages}</div>
              <div className="text-sm text-muted-foreground">Total Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatDuration(stats.totalDuration)}
              </div>
              <div className="text-sm text-muted-foreground">Total Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">
                {formatDuration(stats.averageSessionDuration)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Session Management
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50' : ''}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh: {autoRefresh ? 'On' : 'Off'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={refreshSessions}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cleanupSessions}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Cleanup
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.totalSessions === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active sessions found</p>
              <p className="text-sm">Sessions will appear here when users start voice interactions</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Realtime Sessions */}
                {realtimeSessions.map(session => 
                  renderSessionCard(session, 'realtime')
                )}

                {/* WebSocket Sessions */}
                {webSocketSessions.map(session => 
                  renderSessionCard(session, 'websocket')
                )}

                {/* Transcription Sessions */}
                {transcriptionSessions.map(session => 
                  renderSessionCard(session, 'transcription')
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Session Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Realtime Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {realtimeSessions.length}
            </div>
            <Progress 
              value={stats.totalSessions > 0 ? (realtimeSessions.length / stats.totalSessions) * 100 : 0} 
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              Voice conversations using RealtimeAgent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              WebSocket Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-2">
              {webSocketSessions.length}
            </div>
            <Progress 
              value={stats.totalSessions > 0 ? (webSocketSessions.length / stats.totalSessions) * 100 : 0} 
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              Direct WebSocket connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mic className="w-4 h-4" />
              Transcription Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {transcriptionSessions.length}
            </div>
            <Progress 
              value={stats.totalSessions > 0 ? (transcriptionSessions.length / stats.totalSessions) * 100 : 0} 
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              Audio transcription only
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SessionManager;