import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, Crown } from 'lucide-react';

interface AutoBumpSetting {
  id: string;
  enabled: boolean;
  interval_hours: number;
  last_auto_bump_at?: string;
}

export const AutoBumpSettings = () => {
  const { user } = useAuth();
  const { isPremium, subscription_tier } = useSubscription();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AutoBumpSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Define interval options based on subscription tier
  const getIntervalOptions = () => {
    if (subscription_tier === 'premium') {
      return [
        { value: 2, label: '2 hours' },
        { value: 4, label: '4 hours' },
        { value: 6, label: '6 hours' },
        { value: 12, label: '12 hours' },
        { value: 24, label: '24 hours' }
      ];
    } else if (subscription_tier === 'free') {
      return [];
    } else {
      // Handle other subscription tiers (small, medium, etc.)
      const tierStr = subscription_tier as string;
      if (tierStr === 'medium') {
        return [
          { value: 6, label: '6 hours' },
          { value: 12, label: '12 hours' },
          { value: 24, label: '24 hours' }
        ];
      } else if (tierStr === 'small') {
        return [
          { value: 12, label: '12 hours' },
          { value: 24, label: '24 hours' }
        ];
      }
      return [];
    }
  };

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('auto_bump_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // Create default settings
        const { data: newSettings, error: createError } = await supabase
          .from('auto_bump_settings')
          .insert({
            user_id: user.id,
            enabled: false,
            interval_hours: subscription_tier === 'premium' ? 4 : (subscription_tier as string) === 'medium' ? 6 : 12
          })
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching auto-bump settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load auto-bump settings"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<AutoBumpSetting>) => {
    if (!user || !settings) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('auto_bump_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      toast({
        title: "Settings Updated",
        description: "Your auto-bump settings have been saved"
      });
    } catch (error) {
      console.error('Error updating auto-bump settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update auto-bump settings"
      });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user, subscription_tier]);

  if (!isPremium) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Auto-Bump Settings
            <Badge variant="secondary">Premium Feature</Badge>
          </CardTitle>
          <CardDescription>
            Upgrade to a premium plan to automatically bump your listings every few hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Crown className="h-4 w-4" />
            <span>This feature is available for Small, Medium, and Premium subscribers</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auto-Bump Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading settings...</div>
        </CardContent>
      </Card>
    );
  }

  const intervalOptions = getIntervalOptions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Auto-Bump Settings
          <Badge variant="default">Premium</Badge>
        </CardTitle>
        <CardDescription>
          Automatically bump all your active listings at regular intervals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Enable Auto-Bump</Label>
            <p className="text-sm text-muted-foreground">
              Automatically bump all your listings to keep them visible
            </p>
          </div>
          <Switch
            checked={settings?.enabled || false}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
            disabled={updating}
          />
        </div>

        {settings?.enabled && (
          <div className="space-y-2">
            <Label className="text-base font-medium">Bump Interval</Label>
            <Select
              value={settings.interval_hours?.toString()}
              onValueChange={(value) => updateSettings({ interval_hours: parseInt(value) })}
              disabled={updating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {intervalOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How often your listings will be automatically bumped
            </p>
          </div>
        )}

        {settings?.last_auto_bump_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Last auto-bump: {new Date(settings.last_auto_bump_at).toLocaleDateString()} at {new Date(settings.last_auto_bump_at).toLocaleTimeString()}
            </span>
          </div>
        )}

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">How Auto-Bump Works</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• All your active listings will be bumped automatically</li>
            <li>• Bumps happen at your selected interval</li>
            <li>• Auto-bumps respect normal cooldown periods</li>
            <li>• You can manually bump anytime in addition to auto-bumps</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};