import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings, Clock, Shield } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface MaintenanceStatus {
  id: string;
  is_maintenance_mode: boolean;
  maintenance_message: string | null;
  created_at: string;
}

const MaintenanceMode = ({ children }: { children: React.ReactNode }) => {
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  
  // Check for admin bypass in URL
  const hasAdminBypass = location.search.includes('admin=true') || location.pathname.includes('/admin');

  useEffect(() => {
    checkMaintenanceStatus();
    checkAdminStatus();
    
    // Set up real-time subscription for maintenance status changes
    const subscription = supabase
      .channel('maintenance_status')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'site_maintenance'
        }, 
        (payload) => {
          console.log('Maintenance status changed:', payload);
          
          // If maintenance mode was just enabled and user is not admin, force refresh
          if ((payload.new as any)?.is_maintenance_mode && !isAdmin && !hasAdminBypass) {
            window.location.reload();
            return;
          }
          
          checkMaintenanceStatus();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('site_maintenance')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking maintenance status:', error);
      }

      setMaintenanceStatus(data as MaintenanceStatus | null);
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    } finally {
      setLoading(false);
    }
  };

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
      setIsAdmin(false);
    }
  };

  const handleAdminBypass = () => {
    // Add admin bypass parameter and refresh page
    const url = new URL(window.location.href);
    url.searchParams.set('admin', 'true');
    window.location.href = url.toString();
  };

  // If loading, show children (don't block the app)
  if (loading) {
    return <>{children}</>;
  }

  // If maintenance mode is active and user is not admin (and no admin bypass), show maintenance page
  if (maintenanceStatus?.is_maintenance_mode && !isAdmin && !hasAdminBypass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <Card className="relative z-10 max-w-2xl w-full bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full border border-orange-500/30 mb-4">
                <AlertTriangle className="h-10 w-10 text-orange-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
                Maintenance Mode
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full mb-6"></div>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-xl text-gray-300">
                {maintenanceStatus.maintenance_message || 'We are currently performing scheduled maintenance to improve your experience.'}
              </p>
              <p className="text-gray-400">
                We apologize for any inconvenience. Please check back soon!
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System Maintenance
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Started: {new Date(maintenanceStatus.created_at).toLocaleString()}
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
              <p className="text-sm text-gray-400">
                For urgent support, please contact us at{' '}
                <a href="mailto:info@x-ampledevelopment.co.uk" className="text-orange-400 hover:text-orange-300">
                  info@x-ampledevelopment.co.uk
                </a>
              </p>
            </div>

            {/* Admin bypass button - only show if user is admin */}
            {isAdmin && (
              <div className="mt-6">
                <Button 
                  onClick={handleAdminBypass}
                  variant="outline"
                  className="bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:border-blue-500/50"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Bypass
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normal operation - show children
  return <>{children}</>;
};

export default MaintenanceMode;