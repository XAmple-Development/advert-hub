
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Handle OAuth callback tokens in URL
    const handleOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const providerToken = hashParams.get('provider_token');
      
      console.log('OAuth callback - access_token:', !!accessToken, 'provider_token:', !!providerToken);
      
      if (accessToken && providerToken) {
        console.log('Found OAuth tokens in URL, storing provider token...');
        
        // Store the Discord provider token for later use
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            console.log('Storing Discord token for user:', user.id);
            // Store the provider token in the user's profile
            const { error } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                discord_access_token: providerToken,
                discord_token_updated_at: new Date().toISOString()
              });
            
            if (error) {
              console.error('Error storing Discord token:', error);
            } else {
              console.log('Discord token stored successfully');
            }
          }
        } catch (error) {
          console.error('Error storing Discord token:', error);
        }
        
        // Clean up the URL by removing the hash fragment
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', !!session?.user, 'provider:', session?.user?.app_metadata?.provider);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle OAuth callback if we have tokens in URL
      if (window.location.hash.includes('access_token')) {
        handleOAuthCallback();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, !!session?.user);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle OAuth callback after successful sign-in
      if (session?.user && window.location.hash.includes('provider_token')) {
        console.log('Handling OAuth callback after auth state change');
        await handleOAuthCallback();
      }
      
      // Also try to extract provider token from user metadata on sign-in
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, checking for provider token in metadata...');
        const providerToken = session.user.user_metadata?.provider_token;
        
        if (providerToken && session.user.app_metadata?.provider === 'discord') {
          console.log('Found provider token in user metadata, storing...');
          try {
            const { error } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                discord_access_token: providerToken,
                discord_token_updated_at: new Date().toISOString()
              });
            
            if (error) {
              console.error('Error storing Discord token from metadata:', error);
            } else {
              console.log('Discord token stored from metadata successfully');
            }
          } catch (error) {
            console.error('Error storing Discord token from metadata:', error);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return { user, loading };
};
