import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  Database,
  ExternalLink,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkVoiceTables, getMigrationSQL } from '@/utils/runMigration';

export const MigrationHelper: React.FC = () => {
  const { toast } = useToast();
  const [tableStatus, setTableStatus] = useState({
    voice_agent_configs: false,
    voice_sessions: false
  });
  const [isChecking, setIsChecking] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  useEffect(() => {
    checkTables();
  }, []);

  const checkTables = async () => {
    setIsChecking(true);
    try {
      const status = await checkVoiceTables();
      setTableStatus(status);
      
      if (!status.voice_sessions) {
        toast({
          title: "Migration Required",
          description: "The voice_sessions table needs to be created",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check table status",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const copySQL = () => {
    const sql = getMigrationSQL();
    navigator.clipboard.writeText(sql);
    toast({
      title: "Copied!",
      description: "Migration SQL copied to clipboard"
    });
  };

  const openSupabaseSQL = () => {
    window.open('https://supabase.com/dashboard/project/ufgqmqoykddaotdbwteg/sql/new', '_blank');
  };

  const allTablesExist = tableStatus.voice_agent_configs && tableStatus.voice_sessions;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Migration Status
        </CardTitle>
        <CardDescription>
          Check and fix missing database tables for voice functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Table Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Required Tables</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded bg-black/20">
              <span className="text-sm">voice_agent_configs</span>
              {tableStatus.voice_agent_configs ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Exists
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Missing
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-black/20">
              <span className="text-sm">voice_sessions</span>
              {tableStatus.voice_sessions ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Exists
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Missing
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Status Alert */}
        {allTablesExist ? (
          <Alert className="glass-card border-green-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>All tables are ready!</AlertTitle>
            <AlertDescription>
              Your database is properly configured for voice functionality.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="glass-card border-red-500">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertTitle>Migration Required</AlertTitle>
            <AlertDescription>
              The voice_sessions table is missing. Please run the migration SQL below.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        {!allTablesExist && (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Quick Fix Steps:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Copy the migration SQL below</li>
                <li>Open Supabase SQL Editor</li>
                <li>Paste and run the SQL</li>
                <li>Click "Check Status" to verify</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copySQL}
                variant="outline"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Migration SQL
              </Button>
              <Button
                onClick={openSupabaseSQL}
                variant="default"
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open SQL Editor
              </Button>
            </div>

            {/* Show/Hide SQL */}
            <Button
              onClick={() => setShowSQL(!showSQL)}
              variant="ghost"
              className="w-full"
            >
              <Terminal className="h-4 w-4 mr-2" />
              {showSQL ? 'Hide' : 'Show'} Migration SQL
            </Button>

            {showSQL && (
              <div className="relative">
                <pre className="bg-black/20 p-4 rounded text-xs overflow-x-auto max-h-96">
                  {getMigrationSQL()}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={copySQL}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Refresh Button */}
        <Button
          onClick={checkTables}
          variant="outline"
          className="w-full"
          disabled={isChecking}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          Check Status
        </Button>
      </CardContent>
    </Card>
  );
};