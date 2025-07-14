import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import PremiumFeatures from '@/components/PremiumFeatures';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';
import Dashboard from '@/components/Dashboard';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdminUpgrade from '@/components/AdminUpgrade';
import TrendingSection from '@/components/discovery/TrendingSection';
import SmartRecommendations from '@/components/discovery/SmartRecommendations';
import { Button } from '@/components/ui/button';
import { Home, Globe } from 'lucide-react';
import { testRecommendations } from '@/utils/testRecommendations';
import DebugPanel from '@/components/DebugPanel';

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

  // ONE BIG BACKGROUND WRAPPER FOR EVERYTHING
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <div className="text-white text-xl font-medium">Loading...</div>
          </div>
        </div>
      ) : (
        <>
          <Navbar />
          
          {user && (
            <div className="max-w-7xl mx-auto px-6 py-4">
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
                <div className="max-w-7xl mx-auto px-6 py-12">
                  <TrendingSection />
                  <div className="mt-12">
                    <SmartRecommendations />
                  </div>
                </div>
                <Features />
                <HowItWorks />
                <PremiumFeatures />
                <Pricing />
                <Footer />
                {!user && <DebugPanel />}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Index;