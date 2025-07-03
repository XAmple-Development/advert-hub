
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: 'free' | 'premium';
  subscription_end: string | null;
  loading: boolean;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false,
    subscription_tier: 'free',
    subscription_end: null,
    loading: true,
  });

  const checkSubscription = async () => {
    if (!user || !session) {
      console.log('No user or session, setting to free tier');
      setSubscription({
        subscribed: false,
        subscription_tier: 'free',
        subscription_end: null,
        loading: false,
      });
      return;
    }

    try {
      console.log('Checking subscription for user:', user.email);
      setSubscription(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }

      console.log('Subscription data received:', data);
      
      setSubscription({
        subscribed: data.subscribed || false,
        subscription_tier: data.subscription_tier || 'free',
        subscription_end: data.subscription_end,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription({
        subscribed: false,
        subscription_tier: 'free',
        subscription_end: null,
        loading: false,
      });
    }
  };

  const createCheckout = async () => {
    if (!session) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to subscribe",
      });
      return;
    }

    try {
      console.log('Creating checkout session...');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: 'premium' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      console.log('Checkout session created:', data);
      // Open Stripe checkout in a new tab
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: "Failed to create checkout session. Please try again.",
      });
    }
  };

  const openCustomerPortal = async () => {
    console.log('openCustomerPortal called', { hasSession: !!session });
    
    if (!session) {
      console.log('No session available');
      toast({
        variant: "destructive",
        title: "Authentication required", 
        description: "Please sign in to manage subscription",
      });
      return;
    }

    try {
      console.log('Testing Stripe connection first...');
      
      // Test Stripe connection first
      const testResponse = await supabase.functions.invoke('test-stripe');
      console.log('Stripe test response:', testResponse);
      
      if (testResponse.error) {
        throw new Error(`Stripe test failed: ${testResponse.error.message}`);
      }
      
      console.log('Stripe test successful, making customer portal request...');
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Customer portal response:', { data, error });

      if (error) {
        console.error('Customer portal error:', error);
        throw error;
      }

      if (data?.url) {
        console.log('Opening customer portal URL:', data.url);
        window.open(data.url, '_blank');
      } else {
        console.error('No portal URL received in response');
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        variant: "destructive",
        title: "Portal Error",
        description: "Failed to open customer portal. Please try again.",
      });
    }
  };

  useEffect(() => {
    console.log('useSubscription: User/session changed', { hasUser: !!user, hasSession: !!session });
    checkSubscription();
  }, [user, session]);

  // Auto-refresh subscription status periodically only if user exists
  useEffect(() => {
    if (!user || !session) return;

    const interval = setInterval(() => {
      console.log('Auto-refreshing subscription status');
      checkSubscription();
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [user, session]);

  return {
    ...subscription,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    isPremium: subscription.subscription_tier === 'premium',
  };
};
