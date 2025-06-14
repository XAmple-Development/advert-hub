
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
      
      if (accessToken && providerToken) {
        console.log('Found OAuth tokens in URL, storing provider token...');
        
        // Store the Discord provider token for later use
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Store the provider token in the user's profile or a separate table
            await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                discord_access_token: providerToken,
                discord_token_updated_at: new Date().toISOString()
              });
            console.log('Discord token stored successfully');
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
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle OAuth callback if we have tokens in URL
      handleOAuthCallback();
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Handle OAuth callback after successful sign-in
      if (session?.user && window.location.hash.includes('provider_token')) {
        await handleOAuthCallback();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return { user, loading };
};
