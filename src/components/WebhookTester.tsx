import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Webhook, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const WebhookTester = () => {
  const [listingId, setListingId] = useState('');
  const [eventType, setEventType] = useState('new_listing');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const testWebhook = async () => {
    if (!listingId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a listing ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('discord-webhook-notification', {
        body: {
          listing_id: listingId.trim(),
          event_type: eventType
        }
      });

      if (error) {
        throw error;
      }

      setTestResult(data);

      if (data.success) {
        toast({
          title: "Success!",
          description: "Webhook notification sent successfully",
        });
      } else {
        toast({
          title: "Warning",
          description: data.reason || "Webhook not sent",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Webhook test error:', error);
      setTestResult({ success: false, error: error.message });
      toast({
        title: "Error",
        description: "Failed to send webhook notification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Discord Webhook Tester
        </CardTitle>
        <CardDescription>
          Test Discord webhook notifications for your listings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="listingId">Listing ID</Label>
            <Input
              id="listingId"
              placeholder="Enter listing UUID"
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_listing">🆕 New Listing</SelectItem>
                <SelectItem value="listing_updated">📝 Listing Updated</SelectItem>
                <SelectItem value="listing_bumped">🚀 Listing Bumped</SelectItem>
                <SelectItem value="listing_featured">⭐ Listing Featured</SelectItem>
                <SelectItem value="status_update">🔍 Status Update</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={testWebhook} 
          disabled={isLoading || !listingId.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Send className="h-4 w-4 mr-2 animate-pulse" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Test Webhook
            </>
          )}
        </Button>

        {testResult && (
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              {testResult.success ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Success
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Failed
                </Badge>
              )}
            </div>
            <div className="text-sm font-mono bg-gray-50 p-2 rounded">
              {JSON.stringify(testResult, null, 2)}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">How to use:</h4>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Make sure your listing has a `discord_webhook_url` in the database</li>
            <li>Enter the listing ID (UUID) you want to test</li>
            <li>Choose the event type you want to simulate</li>
            <li>Click "Test Webhook" to send a notification</li>
          </ol>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Webhook URL Format:</h4>
          <code className="text-xs bg-blue-100 p-2 rounded block text-blue-900">
            https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
          </code>
          <p className="text-sm text-blue-800 mt-2">
            To get this URL: Go to your Discord channel → Settings → Integrations → Webhooks → Copy Webhook URL
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebhookTester;