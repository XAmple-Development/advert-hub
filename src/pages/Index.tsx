
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card overflow-hidden">
        {/* Cosmic Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float opacity-20"
            style={{
              background: 'var(--gradient-primary)',
              animation: 'float 6s ease-in-out infinite, morphShape 8s ease-in-out infinite'
            }}
          ></div>
          <div 
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl animate-float opacity-15"
            style={{
              background: 'var(--gradient-secondary)',
              animation: 'float 4s ease-in-out infinite reverse, morphShape 6s ease-in-out infinite reverse',
              animationDelay: '2s'
            }}
          ></div>
        </div>
        <div className="relative z-10 flex items-center justify-center space-y-4">
          <LoadingSpinner size="lg" />
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  const handleViewChange = (newView: string) => {
    setSearchParams({ view: newView });
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card overflow-hidden relative">
        {/* Cosmic Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/3 left-1/5 w-80 h-80 rounded-full blur-3xl animate-float opacity-15"
            style={{
              background: 'var(--gradient-primary)',
              animation: 'float 8s ease-in-out infinite, morphShape 12s ease-in-out infinite'
            }}
          ></div>
          <div 
            className="absolute bottom-1/3 right-1/5 w-96 h-96 rounded-full blur-3xl animate-float opacity-10"
            style={{
              background: 'var(--gradient-accent)',
              animation: 'float 6s ease-in-out infinite reverse, morphShape 10s ease-in-out infinite reverse',
              animationDelay: '3s'
            }}
          ></div>
        </div>
        
        <div className="relative z-10 pb-20 md:pb-0">
          <Navbar />
          
          {/* View Toggle for Logged In Users */}
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

          {/* Content based on view */}
          {view === 'dashboard' ? (
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
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card overflow-hidden relative">
      {/* Cosmic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/6 w-72 h-72 rounded-full blur-3xl animate-float opacity-12"
          style={{
            background: 'var(--gradient-secondary)',
            animation: 'float 10s ease-in-out infinite, morphShape 15s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute bottom-1/5 right-1/6 w-80 h-80 rounded-full blur-3xl animate-float opacity-8"
          style={{
            background: 'var(--gradient-primary)',
            animation: 'float 7s ease-in-out infinite reverse, morphShape 12s ease-in-out infinite reverse',
            animationDelay: '4s'
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl animate-float opacity-5"
          style={{
            background: 'var(--gradient-accent)',
            animation: 'float 12s ease-in-out infinite, morphShape 18s ease-in-out infinite',
            animationDelay: '2s'
          }}
        ></div>
      </div>
      
      <div className="relative z-10">
        <Navbar />
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
        <DebugPanel />
      </div>
    </div>
  );
};

export default Index;
