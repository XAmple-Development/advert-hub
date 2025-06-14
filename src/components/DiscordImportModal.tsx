
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DiscordImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface DiscordServer {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

const DiscordImportModal: React.FC<DiscordImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [servers, setServers] = useState<DiscordServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const fetchServers = async () => {
    if (!session?.access_token) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with Discord to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/functions/v1/discord-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'fetch' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to fetch servers');
      }

      setServers(data.servers || []);
      
      if (data.servers?.length === 0) {
        toast({
          title: "No Servers Found",
          description: "You don't have any Discord servers where you can manage settings.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Error fetching servers:', error);
      toast({
        title: "Error Fetching Servers",
        description: error.message || "Failed to fetch your Discord servers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const importServer = async (serverId: string, serverName: string) => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with Discord to continue.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .insert([
          {
            discord_id: serverId,
            name: serverName,
            description: `Imported from Discord: ${serverName}`,
            user_id: session.user.id,
            type: 'server',
            status: 'active',
          },
        ])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Server Already Added",
            description: "This server has already been added to your listings.",
            variant: "default",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Server Imported Successfully",
          description: `${serverName} has been added to your listings.`,
        });
        onImportComplete();
        onClose();
      }
    } catch (error: any) {
      console.error('Error importing server:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleOpen = () => {
    if (isOpen) {
      fetchServers();
    }
  };

  React.useEffect(() => {
    handleOpen();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Discord Servers</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading your servers...</p>
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No manageable servers found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                You need to own a server or have "Manage Server" permissions.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {server.icon ? (
                      <img
                        src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
                        alt={server.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {server.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{server.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {server.owner ? 'Owner' : 'Manager'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => importServer(server.id, server.name)}
                    disabled={importing}
                    size="sm"
                  >
                    {importing ? 'Importing...' : 'Import'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscordImportModal;
