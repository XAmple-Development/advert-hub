
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, User, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BottomNavigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-700/50 z-40 md:hidden">
      <div className="flex items-center justify-around py-2">
        <Link
          to="/"
          className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
            isActive('/') 
              ? 'text-purple-400 bg-purple-500/20' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>

        <Link
          to="/listings"
          className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
            isActive('/listings') 
              ? 'text-purple-400 bg-purple-500/20' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-xs mt-1">Browse</span>
        </Link>

        {isAdmin && (
          <Link
            to="/admin"
            className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
              isActive('/admin') 
                ? 'text-orange-400 bg-orange-500/20' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="h-5 w-5" />
            <span className="text-xs mt-1">Admin</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default BottomNavigation;
