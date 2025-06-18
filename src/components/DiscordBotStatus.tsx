
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DiscordBotStatus = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
  const { toast } = useToast();

  const registerCommands = async () => {
    setIsRegistering(true);
    try {
      const { data, error } = await supabase.functions.invoke('discord-register-commands');
      
      if (error) {
        throw error;
      }

      setRegistrationStatus('success');
      toast({
        title: "Success",
        description: "Discord slash commands registered successfully!",
      });
    } catch (error) {
      console.error('Error registering commands:', error);
      setRegistrationStatus('error');
      toast({
        title: "Error",
        description: "Failed to register Discord commands. Check your bot configuration.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Discord Bot Status
        </CardTitle>
        <CardDescription>
          Manage your Discord bot configuration and commands
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Slash Commands</span>
            {registrationStatus === 'success' && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Registered
              </Badge>
            )}
            {registrationStatus === 'error' && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Error
              </Badge>
            )}
            {registrationStatus === 'unknown' && (
              <Badge variant="secondary">Unknown</Badge>
            )}
          </div>
          <Button 
            onClick={registerCommands} 
            disabled={isRegistering}
            size="sm"
          >
            {isRegistering ? 'Registering...' : 'Register Commands'}
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Available Commands:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <code>/bump</code> - Bump server listing to top (2-hour cooldown)</li>
            <li>• <code>/setup &lt;channel&gt;</code> - Configure listing announcements channel</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Create a Discord application at discord.com/developers</li>
            <li>2. Add bot token and keys to Supabase secrets</li>
            <li>3. Set interactions endpoint URL in Discord</li>
            <li>4. Register slash commands using the button above</li>
            <li>5. Invite bot to your server with proper permissions</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscordBotStatus;
