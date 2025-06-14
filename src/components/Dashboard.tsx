
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import CreateListingModal from './CreateListingModal';
import DiscordImportModal from './DiscordImportModal';
import { Plus, Import, ExternalLink, Users, Calendar, BarChart3 } from 'lucide-react';

interface Server {
  id: string;
  discord_id: string;
  name: string;
  description: string | null;
  invite_url: string | null;
  member_count: number | null;
  category: string | null;
  tags: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const fetchServers = async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServers(data || []);
    } catch (error: any) {
      console.error('Error fetching servers:', error);
      toast({
        title: "Error Loading Servers",
        description: "Failed to load your servers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [session?.user?.id]);

  const handleServerUpdate = () => {
    fetchServers();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your Discord server listings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowImportModal(true)} variant="outline">
            <Import className="w-4 h-4 mr-2" />
            Import from Discord
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Listing
          </Button>
        </div>
      </div>

      {servers.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-16 h-16 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No servers yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first server listing or importing from Discord.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => setShowImportModal(true)} variant="outline">
              <Import className="w-4 h-4 mr-2" />
              Import from Discord
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Listing
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <Card key={server.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{server.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {server.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(server.status)}>
                    {server.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {server.category && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      {server.category}
                    </div>
                  )}
                  
                  {server.member_count && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      {server.member_count.toLocaleString()} members
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    Created {formatDate(server.created_at)}
                  </div>

                  {server.tags && server.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {server.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {server.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{server.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {server.invite_url && (
                    <div className="pt-2">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a 
                          href={server.invite_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Visit Server
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateListingModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onServerCreated={handleServerUpdate}
      />

      <DiscordImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleServerUpdate}
      />
    </div>
  );
};

export default Dashboard;
