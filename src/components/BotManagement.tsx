
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ModernCard from '@/components/ui/modern-card';
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
    <div className="space-y-8">
      <DiscordBotStatus />
      
      <ModernCard variant="glass" className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
            <Settings className="h-5 w-5 text-primary" />
            Server Configurations
          </h2>
          <p className="text-muted-foreground">
            Manage Discord bot settings for each server
          </p>
        </div>
        <div className="space-y-6">
          {isLoading ? (
            <p className="text-muted-foreground">Loading configurations...</p>
          ) : botConfigs.length > 0 ? (
            <div className="space-y-4">
              {botConfigs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-6 bg-card/50 border border-border/50 rounded-xl backdrop-blur-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-foreground">Server ID: {config.discord_server_id}</span>
                      <Badge variant={config.active ? "default" : "secondary"} className="bg-primary/10 text-primary border-primary/20">
                        {config.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Channel: {config.listing_channel_id || "Not configured"}
                    </p>
                    <p className="text-sm text-muted-foreground">
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
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Bot Configurations</h3>
              <p className="text-muted-foreground mb-4">
                Set up your Discord bot by using the <code className="bg-muted px-2 py-1 rounded text-sm">/setup</code> command in your Discord server.
              </p>
            </div>
          )}
        </div>
      </ModernCard>

      <ModernCard variant="glass" className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground mb-2">Useful Links</h2>
        </div>
        <div className="space-y-3">
          <a 
            href="https://discord.com/developers/applications" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Discord Developer Portal
          </a>
          <a 
            href="https://aurrzqdypbshynbowpbs.supabase.co/functions/discord-bot/logs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Bot Function Logs
          </a>
        </div>
      </ModernCard>
    </div>
  );
};

export default BotManagement;
