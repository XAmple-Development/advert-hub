import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, MessageSquare, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SiteStatusManager = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const { toast } = useToast();

  const triggerStatusUpdate = async () => {
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('site-status-update');
      
      if (error) {
        throw error;
      }

      setLastUpdate(new Date().toLocaleString());
      toast({
        title: "Success",
        description: "Site status updated successfully across all Discord channels!",
      });
    } catch (error) {
      console.error('Error updating site status:', error);
      toast({
        title: "Error",
        description: "Failed to update site status. Check your configuration.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Site Status Manager
        </CardTitle>
        <CardDescription>
          Manage automated site status updates to Discord channels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Manual Update</span>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Discord Status
            </Badge>
          </div>
          <Button 
            onClick={triggerStatusUpdate} 
            disabled={isUpdating}
            size="sm"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Status Now'
            )}
          </Button>
        </div>

        {lastUpdate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            Last update: {lastUpdate}
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">How it works:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Status messages are posted to Discord bump channels</li>
            <li>• Messages show real-time health of Supabase API and Edge Functions</li>
            <li>• The same message is updated each time (not creating new ones)</li>
            <li>• Status includes response times and service availability</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Automatic Updates:</h4>
          <p className="text-sm text-blue-800 mb-2">
            To enable hourly automatic updates, run this SQL in your Supabase SQL editor:
          </p>
          <code className="text-xs bg-blue-100 p-2 rounded block text-blue-900">
            {`SELECT cron.schedule(
  'site-status-hourly-update',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://aurrzqdypbshynbowpbs.supabase.co/functions/v1/site-status-update',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);`}
          </code>
        </div>
      </CardContent>
    </Card>
  );
};

export default SiteStatusManager;