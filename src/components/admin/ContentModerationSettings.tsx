import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Flag, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Users,
  Clock,
  Filter,
  Settings,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FlaggedConversation {
  id: string;
  user_id: string;
  conversation_id: string;
  reason: string;
  original_response: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

interface ModerationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high';
  auto_action: 'flag' | 'block' | 'warn';
  keywords: string[];
}

export const ContentModerationSettings = () => {
  const [flaggedConversations, setFlaggedConversations] = useState<FlaggedConversation[]>([]);
  const [moderationRules, setModerationRules] = useState<ModerationRule[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<FlaggedConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  
  const { toast } = useToast();

  // Moderation settings
  const [settings, setSettings] = useState({
    auto_moderation: true,
    confidence_threshold: 0.7,
    require_review: true,
    notify_admins: true,
    block_on_flag: false,
    max_warnings: 3
  });

  useEffect(() => {
    loadFlaggedConversations();
    loadModerationRules();
  }, []);

  const loadFlaggedConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('flagged_conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setFlaggedConversations(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading flagged conversations",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadModerationRules = async () => {
    // Mock data for moderation rules - in real app, load from database
    setModerationRules([
      {
        id: '1',
        name: 'Inappropriate Language',
        description: 'Detects profanity and inappropriate language',
        enabled: true,
        severity: 'medium',
        auto_action: 'flag',
        keywords: ['profanity', 'inappropriate']
      },
      {
        id: '2',
        name: 'Personal Information',
        description: 'Detects sharing of personal information',
        enabled: true,
        severity: 'high',
        auto_action: 'block',
        keywords: ['email', 'phone', 'address']
      },
      {
        id: '3',
        name: 'Harassment',
        description: 'Detects potential harassment or bullying',
        enabled: true,
        severity: 'high',
        auto_action: 'flag',
        keywords: ['harassment', 'bullying', 'threats']
      }
    ]);
  };

  const reviewConversation = async () => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase
        .from('flagged_conversations')
        .update({
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedConversation.id);

      if (error) throw error;

      toast({
        title: "Review completed",
        description: `Conversation ${reviewAction === 'approve' ? 'approved' : 'rejected'}`
      });

      setReviewDialog(false);
      setSelectedConversation(null);
      setReviewNotes('');
      loadFlaggedConversations();
    } catch (error: any) {
      toast({
        title: "Error reviewing conversation",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (conversation: FlaggedConversation) => {
    if (conversation.reviewed_at) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Content Moderation</h2>
          <p className="text-muted-foreground">Manage content moderation and review flagged content</p>
        </div>
      </div>

      <Tabs defaultValue="flagged" className="space-y-6">
        <TabsList className="glass">
          <TabsTrigger value="flagged">
            <Flag className="w-4 h-4 mr-2" />
            Flagged Content
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Filter className="w-4 h-4 mr-2" />
            Moderation Rules
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flagged" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="glass-card border-glass">
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Flag className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-red-500">{flaggedConversations.length}</p>
                <p className="text-xs text-muted-foreground">Total Flagged</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-glass">
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold text-yellow-500">
                  {flaggedConversations.filter(c => !c.reviewed_at).length}
                </p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-glass">
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-500">
                  {flaggedConversations.filter(c => c.reviewed_at).length}
                </p>
                <p className="text-xs text-muted-foreground">Reviewed</p>
              </CardContent>
            </Card>

            <Card className="glass-card border-glass">
              <CardContent className="p-4 text-center">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-500">
                  {Math.round((flaggedConversations.filter(c => c.reviewed_at).length / Math.max(flaggedConversations.length, 1)) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Review Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Flagged Conversations List */}
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle>Flagged Conversations</CardTitle>
              <CardDescription>
                Review and manage content that has been flagged by the moderation system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {flaggedConversations.length > 0 ? (
                <div className="space-y-4">
                  {flaggedConversations.map((conversation) => (
                    <div key={conversation.id} className="border border-glass rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(conversation)}
                          <div>
                            <p className="font-medium">Conversation {conversation.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              User: {conversation.user_id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {conversation.reason || 'Automatic Flag'}
                          </Badge>
                          <Badge variant={conversation.reviewed_at ? "default" : "secondary"}>
                            {conversation.reviewed_at ? 'Reviewed' : 'Pending'}
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-muted/20 rounded p-3 mb-3">
                        <p className="text-sm text-muted-foreground mb-1">Flagged Content:</p>
                        <p className="text-sm">{conversation.original_response}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Flagged: {new Date(conversation.created_at).toLocaleString()}
                        </span>
                        {!conversation.reviewed_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedConversation(conversation);
                              setReviewDialog(true);
                            }}
                            className="glass"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No flagged conversations</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle>Moderation Rules</CardTitle>
              <CardDescription>
                Configure automatic moderation rules and their actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {moderationRules.map((rule) => (
                  <div key={rule.id} className="border border-glass rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Switch checked={rule.enabled} />
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge className={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Action: <span className="font-medium">{rule.auto_action}</span></span>
                          <span>Keywords: {rule.keywords.length}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="glass">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="glass-card border-glass">
            <CardHeader>
              <CardTitle>Moderation Settings</CardTitle>
              <CardDescription>
                Configure global moderation behavior and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Moderation</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable AI-powered automatic content moderation
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_moderation}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      auto_moderation: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Manual Review</Label>
                    <p className="text-sm text-muted-foreground">
                      All flagged content requires admin review before action
                    </p>
                  </div>
                  <Switch
                    checked={settings.require_review}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      require_review: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notify Admins</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications when content is flagged
                    </p>
                  </div>
                  <Switch
                    checked={settings.notify_admins}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      notify_admins: checked
                    })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-block on Flag</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically block users when content is flagged
                    </p>
                  </div>
                  <Switch
                    checked={settings.block_on_flag}
                    onCheckedChange={(checked) => setSettings({
                      ...settings,
                      block_on_flag: checked
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="confidence_threshold">Confidence Threshold</Label>
                  <Input
                    id="confidence_threshold"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={settings.confidence_threshold}
                    onChange={(e) => setSettings({
                      ...settings,
                      confidence_threshold: parseFloat(e.target.value)
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Threshold for automatic flagging (0.0 - 1.0)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_warnings">Max Warnings</Label>
                  <Input
                    id="max_warnings"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.max_warnings}
                    onChange={(e) => setSettings({
                      ...settings,
                      max_warnings: parseInt(e.target.value)
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of warnings before user suspension
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Flagged Content</DialogTitle>
            <DialogDescription>
              Decide whether to approve or reject this flagged content
            </DialogDescription>
          </DialogHeader>

          {selectedConversation && (
            <div className="space-y-4">
              <div className="bg-muted/20 rounded p-3">
                <p className="text-sm font-medium mb-2">Flagged Content:</p>
                <p className="text-sm">{selectedConversation.original_response}</p>
              </div>

              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={reviewAction} onValueChange={(value: any) => setReviewAction(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve (No Action Needed)</SelectItem>
                    <SelectItem value="reject">Reject (Violation Confirmed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_notes">Notes (Optional)</Label>
                <Textarea
                  id="review_notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about your decision..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={reviewConversation} className="bg-gradient-primary">
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};