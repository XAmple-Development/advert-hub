import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

// Define types for context
interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching session:", error);
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
      }

      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[Auth State Change]", event);

      setUser(session?.user ?? null);
      setSession(session ?? null);
      setLoading(false);

      // If signed in with Discord, save the provider token
      if (session?.user?.app_metadata?.provider === "discord") {
        const providerToken =
          session.provider_token || session.user?.user_metadata?.provider_token;

        if (providerToken) {
          try {
            const { error } = await supabase.from("profiles").upsert({
              id: session.user.id,
              discord_access_token: providerToken,
              discord_token_updated_at: new Date().toISOString(),
            });

            if (error) {
              console.error("Error storing Discord token:", error);
            }
          } catch (err) {
            console.error("Exception storing Discord token:", err);
          }
        }
      }
    });

    initSession();

    return () => {
      subscription.unsubscribe(); // ✅ Correct usage for Supabase v2
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
