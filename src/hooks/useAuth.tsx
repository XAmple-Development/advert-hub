
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    console.log('Auth: Initializing auth state...');

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth: Error getting session:', error);
        }
        
        if (mounted) {
          console.log('Auth: Initial session loaded:', !!session);
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth: Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth: State change event:', event, !!session);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Only set loading to false after we've processed the auth change
          if (event !== 'INITIAL_SESSION') {
            setLoading(false);
          }

          // Handle Discord provider token storage
          if (session?.user?.app_metadata?.provider === "discord" && event === 'SIGNED_IN') {
            const token = session.provider_token || session.user?.user_metadata?.provider_token;
            if (token) {
              setTimeout(async () => {
                try {
                  await supabase.from("profiles").upsert({
                    id: session.user.id,
                    discord_access_token: token,
                    discord_token_updated_at: new Date().toISOString(),
                  });
                  
                  // Check subscription status after successful login
                  console.log('Auth: Checking subscription status after login');
                  await supabase.functions.invoke('check-subscription', {
                    headers: {
                      Authorization: `Bearer ${session.access_token}`,
                    },
                  });
                } catch (error) {
                  console.error('Auth: Error storing Discord token or checking subscription:', error);
                }
              }, 0);
            }
          }
        }
      }
    );

    // Get initial session
    getInitialSession();

    // Failsafe: Ensure loading is set to false after a reasonable timeout
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.log('Auth: Timeout reached, setting loading to false');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
