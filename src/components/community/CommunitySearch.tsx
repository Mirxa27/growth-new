import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Users, 
  UserPlus, 
  UserCheck, 
  Clock,
  Sparkles,
  Heart
} from 'lucide-react';

interface CommunityMember {
  user_id: string;
  display_name: string;
  personality_type?: string;
  crystals_count: number;
  subscription_tier: string;
  created_at: string;
  connectionStatus?: 'none' | 'pending' | 'connected';
}

interface Connection {
  id: string;
  requester_id: string;
  requested_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

export const CommunitySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CommunityMember[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    fetchConnections();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchConnections = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await supabase
        .from('community_connections')
        .select('*')
        .or(`requester_id.eq.${currentUserId},requested_id.eq.${currentUserId}`);

      if (error) throw error;
      setConnections((data as any[] || []).map(conn => ({
        ...conn,
        status: conn.status as 'pending' | 'accepted'
      })));
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const searchMembers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, personality_type, crystals_count, subscription_tier, created_at')
        .ilike('display_name', `%${searchQuery}%`)
        .neq('user_id', currentUserId)
        .limit(20);

      if (error) throw error;

      // Enhance results with connection status
      const enhancedResults = (data || []).map(member => {
        const existingConnection = connections.find(conn => 
          (conn.requester_id === member.user_id && conn.requested_id === currentUserId) ||
          (conn.requested_id === member.user_id && conn.requester_id === currentUserId)
        );

        let connectionStatus: 'none' | 'pending' | 'connected' = 'none';
        if (existingConnection) {
          connectionStatus = existingConnection.status === 'accepted' ? 'connected' : 'pending';
        }

        return {
          ...member,
          connectionStatus
        };
      });

      setSearchResults(enhancedResults);
    } catch (error) {
      console.error('Error searching members:', error);
      toast({
        title: "Search Error",
        description: "Failed to search community members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (targetUserId: string) => {
    try {
      const { error } = await supabase
        .from('community_connections')
        .insert({
          requester_id: currentUserId,
          requested_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent!",
      });

      // Update local state
      setSearchResults(prev => 
        prev.map(member => 
          member.user_id === targetUserId 
            ? { ...member, connectionStatus: 'pending' as const }
            : member
        )
      );

      fetchConnections();
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive"
      });
    }
  };

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'pro': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'discovery': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default: return 'bg-muted';
    }
  };

  const getPersonalityIcon = (type?: string) => {
    if (!type) return <Users className="w-4 h-4" />;
    if (type.includes('Explorer')) return <Search className="w-4 h-4" />;
    if (type.includes('Connector')) return <Heart className="w-4 h-4" />;
    if (type.includes('Student')) return <Sparkles className="w-4 h-4" />;
    if (type.includes('Leader')) return <UserCheck className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Find Your Tribe</h2>
        <p className="text-muted-foreground">
          Connect with like-minded women on similar growth journeys
        </p>
      </div>

      {/* Search Input */}
      <Card className="glass-card border-glass">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by display name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchMembers();
                  }
                }}
              />
            </div>
            <Button 
              onClick={searchMembers}
              disabled={loading || !searchQuery.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results</h3>
          <div className="grid gap-4">
            {searchResults.map((member) => (
              <Card key={member.user_id} className="glass-card border-glass">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.display_name}`} />
                        <AvatarFallback>
                          {member.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {member.display_name || 'Anonymous Member'}
                        </h4>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {member.personality_type && (
                            <Badge 
                              variant="outline" 
                              className="text-xs flex items-center gap-1"
                            >
                              {getPersonalityIcon(member.personality_type)}
                              {member.personality_type}
                            </Badge>
                          )}
                          
                          <Badge 
                            className={`text-xs text-white ${getSubscriptionColor(member.subscription_tier)}`}
                          >
                            {member.subscription_tier}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {member.crystals_count} crystals
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Joined {new Date(member.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Connection Button */}
                    <div>
                      {member.connectionStatus === 'connected' ? (
                        <Button variant="outline" disabled className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          Connected
                        </Button>
                      ) : member.connectionStatus === 'pending' ? (
                        <Button variant="outline" disabled className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Pending
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => sendConnectionRequest(member.user_id)}
                          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                        >
                          <UserPlus className="w-4 h-4" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {searchQuery && !loading && searchResults.length === 0 && (
        <Card className="glass-card border-glass">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Members Found</h3>
            <p className="text-muted-foreground">
              Try searching with a different display name or check the spelling.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Community Guidelines */}
      <Card className="glass-card border-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Community Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-foreground">Respect & Privacy</p>
              <p className="text-sm text-muted-foreground">
                Your profile is only visible to users you've connected with mutually
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/5">
            <div className="w-2 h-2 rounded-full bg-secondary mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-foreground">Supportive Environment</p>
              <p className="text-sm text-muted-foreground">
                Share insights, support each other's growth, and celebrate milestones together
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/5">
            <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0"></div>
            <div>
              <p className="font-medium text-foreground">Authentic Connection</p>
              <p className="text-sm text-muted-foreground">
                Build meaningful relationships based on genuine personal growth
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};