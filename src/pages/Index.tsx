import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Dashboard from '@/components/Dashboard';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdminUpgrade from '@/components/AdminUpgrade';
import TrendingSection from '@/components/discovery/TrendingSection';
import SmartRecommendations from '@/components/discovery/SmartRecommendations';
import ModernLayout from '@/components/layout/ModernLayout';
import ModernCard from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Home, Globe } from 'lucide-react';
import { testRecommendations } from '@/utils/testRecommendations';
import DebugPanel from '@/components/DebugPanel';
import Pricing from '@/components/Pricing';

const Index = () => {
  // Test the recommendations on page load in development
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('Testing AI recommendations and trending...');
      testRecommendations();
    }
  }, []);
  const { user, loading } = useAuth();
  const { checkSubscription } = useSubscription();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || (user ? 'dashboard' : 'home');
  
  // Handle Stripe success/cancel URLs
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true' && user) {
      toast({
        title: "Payment successful!",
        description: "Your subscription has been activated. Checking status...",
      });
      
      // Check subscription status after successful payment
      setTimeout(() => {
        checkSubscription();
      }, 2000); // Wait 2 seconds for Stripe to process
      
      // Remove the success parameter from URL
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('success');
        return newParams;
      });
    }
    
    if (canceled === 'true') {
      toast({
        variant: "destructive",
        title: "Payment canceled",
        description: "You can try again anytime.",
      });
      
      // Remove the canceled parameter from URL
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('canceled');
        return newParams;
      });
    }
  }, [searchParams, user, checkSubscription, toast, setSearchParams]);

  console.log('Index: Rendering with loading:', loading, 'user:', !!user);

  const handleViewChange = (newView: string) => {
    setSearchParams({ view: newView });
  };

  return (
    <ModernLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <ModernCard className="p-8 text-center">
            <LoadingSpinner size="lg" />
            <div className="mt-6">
              <div className="text-2xl font-bold mb-2">Loading...</div>
              <div className="text-muted-foreground">Preparing your experience</div>
            </div>
          </ModernCard>
        </div>
      ) : (
        <>
          <Navbar />
          
          {user && (
            <div className="max-w-7xl mx-auto px-6 py-6">
              <ModernCard className="p-6">
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => handleViewChange('dashboard')}
                    variant={view === 'dashboard' ? 'default' : 'outline'}
                    className="flex items-center space-x-2"
                  >
                    <Home className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Button>
                  <Button
                    onClick={() => handleViewChange('home')}
                    variant={view === 'home' ? 'default' : 'outline'}
                    className="flex items-center space-x-2"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                  </Button>
                </div>
              </ModernCard>
            </div>
          )}

          <div className="pb-20 md:pb-0">
            {user && view === 'dashboard' ? (
              <>
                <Dashboard />
                <AdminUpgrade />
              </>
            ) : (
              <>
                <Hero />
                <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
                  {user && <SmartRecommendations />}
                  <TrendingSection />
                </div>
                <Pricing />
                {!user && <DebugPanel />}
              </>
            )}
          </div>
        </>
      )}
    </ModernLayout>
  );
};

export default Index;