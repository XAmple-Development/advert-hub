
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Bot, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DiscordBotStatus from './DiscordBotStatus';

interface BotConfig {
  id: string;
  discord_server_id: string;
  listing_channel_id: string | null;
  admin_user_id: string;
  active: boolean;
}

const BotManagement = () => {
  const [botConfigs, setBotConfigs] = useState<BotConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBotConfigs();
  }, []);

  const fetchBotConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('discord_bot_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBotConfigs(data || []);
    } catch (error) {
      console.error('Error fetching bot configs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bot configurations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBotStatus = async (configId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('discord_bot_configs')
        .update({ active: !currentStatus })
        .eq('id', configId);

      if (error) throw error;
      
      fetchBotConfigs();
      toast({
        title: "Success",
        description: `Bot ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating bot status:', error);
      toast({
        title: "Error",
        description: "Failed to update bot status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <DiscordBotStatus />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Server Configurations
          </CardTitle>
          <CardDescription>
            Manage Discord bot settings for each server
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading configurations...</p>
          ) : botConfigs.length > 0 ? (
            <div className="space-y-4">
              {botConfigs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Server ID: {config.discord_server_id}</span>
                      <Badge variant={config.active ? "default" : "secondary"}>
                        {config.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Channel: {config.listing_channel_id || "Not configured"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Admin: {config.admin_user_id}
                    </p>
                  </div>
                  <Button
                    onClick={() => toggleBotStatus(config.id, config.active)}
                    variant={config.active ? "destructive" : "default"}
                    size="sm"
                  >
                    {config.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Bot Configurations</h3>
              <p className="text-gray-600 mb-4">
                Set up your Discord bot by using the <code>/setup</code> command in your Discord server.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Useful Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a 
            href="https://discord.com/developers/applications" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4" />
            Discord Developer Portal
          </a>
          <a 
            href="https://aurrzqdypbshynbowpbs.supabase.co/functions/discord-bot/logs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <ExternalLink className="h-4 w-4" />
            Bot Function Logs
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default BotManagement;
