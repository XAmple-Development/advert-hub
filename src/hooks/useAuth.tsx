import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthStateChange]', event);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Optional: Store Discord token
      if (session?.user?.app_metadata?.provider === 'discord') {
        const providerToken =
          session.provider_token ||
          session?.user?.user_metadata?.provider_token;

        if (providerToken) {
          try {
            const { error } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                discord_access_token: providerToken,
                discord_token_updated_at: new Date().toISOString(),
              });

            if (error) console.error('Error saving Discord token:', error);
          } catch (e) {
            console.error('Exception storing Discord token:', e);
          }
        }
      }
    });

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
