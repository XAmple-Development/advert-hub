import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  Shield,
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  User,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ContentFlag {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  flag_type: string;
  reason: string;
  status: string;
  created_at: string;
  reporter?: {
    username: string;
    discord_avatar: string;
  };
}

interface ModerationAction {
  id: string;
  moderator_id: string;
  target_type: string;
  target_id: string;
  action_type: string;
  reason: string;
  auto_generated: boolean;
  created_at: string;
  moderator?: {
    username: string;
    discord_avatar: string;
  };
}

interface UserWarning {
  id: string;
  user_id: string;
  moderator_id: string;
  reason: string;
  severity: string;
  is_active: boolean;
  created_at: string;
  expires_at: string;
  user?: {
    username: string;
    discord_avatar: string;
  };
  moderator?: {
    username: string;
  };
}

const ModerationDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contentFlags, setContentFlags] = useState<ContentFlag[]>([]);
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([]);
  const [userWarnings, setUserWarnings] = useState<UserWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchModerationData();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchModerationData = async () => {
    try {
      setLoading(true);

      // Fetch content flags
      const { data: flagsData, error: flagsError } = await supabase
        .from('content_flags')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (flagsError) throw flagsError;

      // Fetch moderation actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('moderation_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (actionsError) throw actionsError;

      // Fetch user warnings
      const { data: warningsData, error: warningsError } = await supabase
        .from('user_warnings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (warningsError) throw warningsError;

      // Now fetch related profiles separately
      const allUserIds = new Set<string>();
      
      flagsData?.forEach(flag => {
        if (flag.reporter_id) allUserIds.add(flag.reporter_id);
        if (flag.reviewed_by) allUserIds.add(flag.reviewed_by);
      });
      
      actionsData?.forEach(action => {
        if (action.moderator_id) allUserIds.add(action.moderator_id);
      });
      
      warningsData?.forEach(warning => {
        if (warning.user_id) allUserIds.add(warning.user_id);
        if (warning.moderator_id) allUserIds.add(warning.moderator_id);
      });

      let profilesData: any[] = [];
      if (allUserIds.size > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, discord_username, discord_avatar')
          .in('id', Array.from(allUserIds));

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      // Combine data with profiles
      const flagsWithProfiles = flagsData?.map(flag => ({
        ...flag,
        reporter: flag.reporter_id ? profilesData.find(p => p.id === flag.reporter_id) : null
      })) || [];

      const actionsWithProfiles = actionsData?.map(action => ({
        ...action,
        moderator: action.moderator_id ? profilesData.find(p => p.id === action.moderator_id) : null
      })) || [];

      const warningsWithProfiles = warningsData?.map(warning => ({
        ...warning,
        user: warning.user_id ? profilesData.find(p => p.id === warning.user_id) : null,
        moderator: warning.moderator_id ? profilesData.find(p => p.id === warning.moderator_id) : null
      })) || [];

      setContentFlags(flagsWithProfiles);
      setModerationActions(actionsWithProfiles);
      setUserWarnings(warningsWithProfiles);
    } catch (error) {
      console.error('Error fetching moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagAction = async (flagId: string, action: 'dismiss' | 'action_taken', reason?: string) => {
    try {
      const { error } = await supabase
        .from('content_flags')
        .update({
          status: action === 'dismiss' ? 'dismissed' : 'action_taken',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', flagId);

      if (error) throw error;

      // Create moderation action record
      const flag = contentFlags.find(f => f.id === flagId);
      if (flag) {
        await supabase
          .from('moderation_actions')
          .insert({
            moderator_id: user?.id,
            target_type: flag.target_type,
            target_id: flag.target_id,
            action_type: action === 'dismiss' ? 'dismiss_flag' : 'resolve_flag',
            reason: reason || `Flag ${action === 'dismiss' ? 'dismissed' : 'resolved'}`,
            auto_generated: false
          });
      }

      toast({
        title: 'Success',
        description: `Flag ${action === 'dismiss' ? 'dismissed' : 'resolved'} successfully`,
      });

      fetchModerationData();
    } catch (error) {
      console.error('Error handling flag action:', error);
      toast({
        title: 'Error',
        description: 'Failed to update flag status',
        variant: 'destructive',
      });
    }
  };

  const getFlagTypeColor = (flagType: string) => {
    switch (flagType) {
      case 'spam':
        return 'bg-red-500/20 text-red-700';
      case 'inappropriate':
        return 'bg-orange-500/20 text-orange-700';
      case 'copyright':
        return 'bg-purple-500/20 text-purple-700';
      case 'fake':
        return 'bg-yellow-500/20 text-yellow-700';
      default:
        return 'bg-gray-500/20 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700';
      case 'reviewed':
        return 'bg-blue-500/20 text-blue-700';
      case 'dismissed':
        return 'bg-gray-500/20 text-gray-700';
      case 'action_taken':
        return 'bg-green-500/20 text-green-700';
      default:
        return 'bg-gray-500/20 text-gray-700';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-500/20 text-green-700';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700';
      case 'high':
        return 'bg-orange-500/20 text-orange-700';
      case 'critical':
        return 'bg-red-500/20 text-red-700';
      default:
        return 'bg-gray-500/20 text-gray-700';
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading moderation data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingFlags = contentFlags.filter(f => f.status === 'pending');
  const recentActions = moderationActions.slice(0, 10);
  const activeWarnings = userWarnings.filter(w => w.is_active);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{pendingFlags.length}</p>
                <p className="text-xs text-muted-foreground">Pending Flags</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{activeWarnings.length}</p>
                <p className="text-xs text-muted-foreground">Active Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{recentActions.length}</p>
                <p className="text-xs text-muted-foreground">Recent Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {contentFlags.filter(f => f.status === 'action_taken').length}
                </p>
                <p className="text-xs text-muted-foreground">Resolved Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Moderation Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="flags">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="flags">Content Flags</TabsTrigger>
              <TabsTrigger value="actions">Recent Actions</TabsTrigger>
              <TabsTrigger value="warnings">User Warnings</TabsTrigger>
            </TabsList>

            <TabsContent value="flags" className="mt-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {contentFlags.map((flag) => (
                    <Card key={flag.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={flag.reporter?.discord_avatar} />
                            <AvatarFallback>
                              {flag.reporter?.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">
                                {flag.reporter?.username || 'Anonymous'}
                              </p>
                              <Badge className={getFlagTypeColor(flag.flag_type)}>
                                {flag.flag_type}
                              </Badge>
                              <Badge className={getStatusColor(flag.status)}>
                                {flag.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Reported {flag.target_type}: {flag.reason}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(flag.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        {flag.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFlagAction(flag.id, 'dismiss')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleFlagAction(flag.id, 'action_taken')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                  
                  {contentFlags.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No content flags found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="actions" className="mt-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {moderationActions.map((action) => (
                    <Card key={action.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={action.moderator?.discord_avatar} />
                          <AvatarFallback>
                            {action.moderator?.username?.[0]?.toUpperCase() || 'M'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">
                              {action.moderator?.username || 'System'}
                            </p>
                            <Badge variant={action.auto_generated ? 'secondary' : 'default'}>
                              {action.action_type}
                            </Badge>
                            {action.auto_generated && (
                              <Badge variant="outline" className="text-xs">
                                Auto
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {action.reason}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {moderationActions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No moderation actions found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="warnings" className="mt-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {userWarnings.map((warning) => (
                    <Card key={warning.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={warning.user?.discord_avatar} />
                          <AvatarFallback>
                            {warning.user?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium">
                              {warning.user?.username || 'Unknown User'}
                            </p>
                            <Badge className={getSeverityColor(warning.severity)}>
                              {warning.severity}
                            </Badge>
                            {warning.is_active && (
                              <Badge variant="destructive">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {warning.reason}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By: {warning.moderator?.username || 'System'}</span>
                            <span>
                              {formatDistanceToNow(new Date(warning.created_at), { addSuffix: true })}
                            </span>
                            {warning.expires_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expires {formatDistanceToNow(new Date(warning.expires_at), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {userWarnings.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No user warnings found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModerationDashboard;