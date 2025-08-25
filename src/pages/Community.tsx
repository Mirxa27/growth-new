import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  MessageSquare,
  Heart,
  Star,
  Globe
} from 'lucide-react';

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  personality_type?: string;
  growth_areas?: string[];
  crystals_count: number;
  subscription_tier: string;
}

interface Connection {
  id: string;
  requester_id: string;
  requested_id: string;
  status: string;
  created_at: string;
}

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchPendingRequests();
    }
  }, [user]);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('community_connections')
        .select('*')
        .or(`requester_id.eq.${user?.id},requested_id.eq.${user?.id}`)
        .eq('status', 'accepted');

      if (error) throw error;
      setConnections(data || []);

      // Fetch connected user profiles
      if (data && data.length > 0) {
        const connectedUserIds = data.map(conn => 
          conn.requester_id === user?.id ? conn.requested_id : conn.requester_id
        );

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', connectedUserIds);

        if (profilesError) throw profilesError;
        setConnectedUsers(profiles || []);
      }
    } catch (error: any) {
      console.error('Error fetching connections:', error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('community_connections')
        .select('*')
        .eq('requested_id', user?.id)
        .eq('status', 'pending');

      if (error) throw error;
      setPendingRequests(data || []);
    } catch (error: any) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', `%${searchQuery}%`)
        .neq('user_id', user?.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
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
          requester_id: user?.id,
          requested_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Connection request sent! ✨",
        description: "They'll be notified of your request.",
      });

      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.id !== targetUserId));
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const respondToRequest = async (connectionId: string, response: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('community_connections')
        .update({ status: response })
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: response === 'accepted' ? "Connection accepted! 🎉" : "Request declined",
        description: response === 'accepted' 
          ? "You're now connected! You can share progress and insights." 
          : "The request has been declined.",
      });

      fetchPendingRequests();
      if (response === 'accepted') {
        fetchConnections();
      }
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const isAlreadyConnected = (userId: string) => {
    return connections.some(conn => 
      (conn.requester_id === userId || conn.requested_id === userId) && conn.status === 'accepted'
    );
  };

  const hasPendingRequest = (userId: string) => {
    return connections.some(conn => 
      ((conn.requester_id === user?.id && conn.requested_id === userId) ||
       (conn.requested_id === user?.id && conn.requester_id === userId)) &&
      conn.status === 'pending'
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-4 pb-20">
      <div className="max-w-6xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold gradient-text">
              Global Community
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Connect with like-minded women on their journey of self-discovery
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Search and Discovery */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Discover New Connections
                </CardTitle>
                <CardDescription>
                  Search for community members by their display name
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by display name..."
                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                    className="glass border-glass"
                  />
                  <Button onClick={searchUsers} disabled={loading} className="bg-primary">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-4 glass-surface rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="bg-primary text-white">
                              {profile.display_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.display_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Star className="h-3 w-3" />
                              {profile.crystals_count} crystals
                              {profile.personality_type && (
                                <Badge variant="outline" className="text-xs">
                                  {profile.personality_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => sendConnectionRequest(profile.id)}
                          disabled={isAlreadyConnected(profile.id) || hasPendingRequest(profile.id)}
                          size="sm"
                          className="bg-primary"
                        >
                          {isAlreadyConnected(profile.id) ? (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Connected
                            </>
                          ) : hasPendingRequest(profile.id) ? (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Pending
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-1" />
                              Connect
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connected Users */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Your Connections ({connectedUsers.length})
                </CardTitle>
                <CardDescription>
                  Women you're connected with on your journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connectedUsers.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {connectedUsers.map((profile) => (
                      <div key={profile.id} className="p-4 glass-surface rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar>
                            <AvatarImage src={profile.avatar_url} />
                            <AvatarFallback className="bg-secondary text-white">
                              {profile.display_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.display_name}</p>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3 w-3" />
                              {profile.crystals_count} crystals
                            </div>
                          </div>
                        </div>
                        
                        {profile.growth_areas && profile.growth_areas.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-muted-foreground mb-1">Growth Areas:</p>
                            <div className="flex flex-wrap gap-1">
                              {profile.growth_areas.slice(0, 2).map((area, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {area}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button size="sm" variant="outline" className="w-full glass">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Message
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No connections yet</p>
                    <p className="text-sm text-muted-foreground">
                      Search for other community members to start building your network!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-accent" />
                    Connection Requests ({pendingRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="p-3 glass-surface rounded-lg">
                      <p className="text-sm mb-3">New connection request</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => respondToRequest(request.id, 'accepted')}
                          size="sm"
                          className="flex-1 bg-primary"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => respondToRequest(request.id, 'declined')}
                          size="sm"
                          variant="outline"
                          className="flex-1 glass"
                        >
                          <UserX className="h-3 w-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Community Stats */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-secondary" />
                  Community Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">10,000+</div>
                  <div className="text-sm text-muted-foreground">Women Growing Together</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">50+</div>
                  <div className="text-sm text-muted-foreground">Countries Represented</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">1M+</div>
                  <div className="text-sm text-muted-foreground">Insights Shared</div>
                </div>
              </CardContent>
            </Card>

            {/* Community Guidelines */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm">Community Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>• Be authentic and kind in all interactions</p>
                <p>• Respect privacy and personal boundaries</p>
                <p>• Share insights that inspire growth</p>
                <p>• Support others on their journey</p>
                <p>• Maintain a safe, inclusive space</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}