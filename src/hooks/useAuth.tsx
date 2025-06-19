
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, !!session?.user);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle Discord token storage on sign-in
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, checking for Discord provider...');
        
        if (session.user.app_metadata?.provider === 'discord') {
          console.log('Discord user detected, attempting to store token...');
          console.log('Session data:', {
            provider_token: !!session.provider_token,
            provider_refresh_token: !!session.provider_refresh_token,
            user_metadata: session.user.user_metadata,
            identities_count: session.user.identities?.length || 0
          });
          
          // Try to get provider token from session
          let providerToken = session.provider_token;
          
          // Fallback to user metadata
          if (!providerToken) {
            providerToken = session.user.user_metadata?.provider_token;
            console.log('Fallback to user metadata token:', !!providerToken);
          }
          
          console.log('Final provider token found:', !!providerToken);
          
          if (providerToken) {
            try {
              console.log('Storing Discord token for user:', session.user.id);
              const { error } = await supabase
                .from('profiles')
                .upsert({
                  id: session.user.id,
                  discord_access_token: providerToken,
                  discord_token_updated_at: new Date().toISOString()
                });
              
              if (error) {
                console.error('Error storing Discord token:', error);
              } else {
                console.log('Discord token stored successfully');
              }
            } catch (error) {
              console.error('Error storing Discord token:', error);
            }
          } else {
            console.warn('No Discord provider token found in session or user metadata');
            console.log('Available session keys:', Object.keys(session || {}));
            console.log('Available user metadata keys:', Object.keys(session.user.user_metadata || {}));
          }
        }
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', !!session?.user, 'provider:', session?.user?.app_metadata?.provider);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return { user, loading };
};
