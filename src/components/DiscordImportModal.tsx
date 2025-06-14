import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Bot, Server } from 'lucide-react';

interface DiscordServer {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
  member_count?: number;
  owner: boolean;
}

interface DiscordBot {
  id: string;
  name: string;
  icon: string | null;
  description: string;
  public: boolean;
}

interface DiscordImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const DiscordImportModal = ({
  open,
  onOpenChange,
  onImportComplete,
}: DiscordImportModalProps) => {
  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<DiscordServer[]>([]);
  const [bots, setBots] = useState<DiscordBot[]>([]);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [selectedBots, setSelectedBots] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const fetchDiscordData = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('No active session found. Please log in.');
      }

      const { data, error } = await supabase.functions.invoke('discord-import', {
        body: { action: 'fetch' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Supabase function error');
      }

      if (
        !data ||
        !Array.isArray(data.servers) ||
        !Array.isArray(data.bots)
      ) {
        throw new Error('Malformed data received from Edge Function');
      }

      setServers(data.servers);
      setBots(data.bots);
    } catch (error: any) {
      console.error('[DiscordImportModal] Error fetching Discord data:', error);
      toast({
        variant: 'destructive',
        title: 'Error fetching Discord data',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDiscordData();
    }
  }, [open]);

  const handleImport = async () => {
    setImporting(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('No active session found. Please log in.');
      }

      const { data, error } = await supabase.functions.invoke('discord-import', {
        body: {
          action: 'import',
          servers: selectedServers,
          bots: selectedBots,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw new Error(error.message);

      toast({
        title: 'Import successful!',
        description: `Imported ${selectedServers.length} servers and ${selectedBots.length} bots.`,
      });

      onImportComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('[DiscordImportModal] Error importing Discord data:', error);
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: error.message,
      });
    } finally {
      setImporting(false);
    }
  };

  const toggleServer = (serverId: string) => {
    setSelectedServers((prev) =>
      prev.includes(serverId)
        ? prev.filter((id) => id !== serverId)
        : [...prev, serverId]
    );
  };

  const toggleBot = (botId: string) => {
    setSelectedBots((prev) =>
      prev.includes(botId)
        ? prev.filter((id) => id !== botId)
        : [...prev, botId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !importing && onOpenChange(next)}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-[#36393F] border-[#40444B]">
        <DialogHeader>
          <DialogTitle className="text-white">Import from Discord</DialogTitle>
          <DialogDescription className="text-gray-400">
            Select your Discord servers and bots to import automatically
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#5865F2]" />
            <span className="ml-2 text-white">Fetching your Discord data...</span>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Servers */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Server className="h-5 w-5" />
                Your Servers ({servers.length})
              </h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {servers.map((server) => (
                    <Card key={server.id} className="bg-[#2C2F33] border-[#40444B]">
                      <CardHeader className="pb-2">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedServers.includes(server.id)}
                            onCheckedChange={() => toggleServer(server.id)}
                          />
                          {server.icon ? (
                            <img
                              src={`https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png`}
                              alt={server.name}
                              className="w-10 h-10 rounded-full"
                              onError={(e) =>
                                (e.currentTarget.src = '/fallback-icon.png')
                              }
                            />
                          ) : (
                            <div className="w-10 h-10 bg-[#5865F2] rounded-full flex items-center justify-center">
                              <Server className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-sm text-white">
                              {server.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {server.owner && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  Owner
                                </Badge>
                              )}
                              {server.member_count && (
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <Users className="h-3 w-3" />
                                  {server.member_count.toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  {servers.length === 0 && (
                    <p className="text-gray-400 text-center py-4">
                      No servers found where you have manage permissions
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Bots */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Your Bots ({bots.length})
              </h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {bots.map((bot) => (
                    <Card key={bot.id} className="bg-[#2C2F33] border-[#40444B]">
                      <CardHeader className="pb-2">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={selectedBots.includes(bot.id)}
                            onCheckedChange={() => toggleBot(bot.id)}
                          />
                          {bot.icon ? (
                            <img
                              src={`https://cdn.discordapp.com/app-icons/${bot.id}/${bot.icon}.png`}
                              alt={bot.name}
                              className="w-10 h-10 rounded-full"
                              onError={(e) =>
                                (e.currentTarget.src = '/fallback-icon.png')
                              }
                            />
                          ) : (
                            <div className="w-10 h-10 bg-[#5865F2] rounded-full flex items-center justify-center">
                              <Bot className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-sm text-white">
                              {bot.name}
                            </CardTitle>
                            <CardDescription className="text-xs text-gray-400">
                              {bot.description || 'No description'}
                            </CardDescription>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant={bot.public ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {bot.public ? 'Public' : 'Private'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  {bots.length === 0 && (
                    <p className="text-gray-400 text-center py-4">
                      No bots found in your Discord applications
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-[#40444B]">
          <div className="text-sm text-gray-400">
            Selected: {selectedServers.length} servers, {selectedBots.length} bots
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={importing}
              className="border-[#40444B] text-gray-300 hover:bg-[#40444B]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                importing ||
                (selectedServers.length === 0 && selectedBots.length === 0)
              }
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                'Import Selected'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiscordImportModal;
