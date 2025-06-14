
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', !!session?.user, 'provider:', session?.user?.app_metadata?.provider);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, !!session?.user);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle Discord token storage on sign-in
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, checking for Discord provider...');
        
        if (session.user.app_metadata?.provider === 'discord') {
          console.log('Discord user detected, attempting to store token...');
          
          // Try to get provider token from user metadata
          let providerToken = session.provider_token;
          
          // Fallback to other possible locations
          if (!providerToken) {
            providerToken = session.user.user_metadata?.provider_token;
          }
          
          // Another fallback - check identities
          if (!providerToken && session.user.identities && session.user.identities.length > 0) {
            const discordIdentity = session.user.identities.find(identity => identity.provider === 'discord');
            if (discordIdentity) {
              providerToken = discordIdentity.access_token;
            }
          }
          
          console.log('Provider token found:', !!providerToken);
          
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
            console.warn('No Discord provider token found in session');
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return { user, loading };
};
