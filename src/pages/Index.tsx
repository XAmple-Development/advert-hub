
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
      <div className="relative">
        {/* Beautiful starry background - full page height */}
        <div 
          className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`,
            minHeight: '200vh'
          }}
        />
        
        {/* Gradient overlays for depth and readability */}
        <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-0" style={{ minHeight: '200vh' }} />
        <div className="fixed inset-0 w-full h-full bg-gradient-to-r from-purple-900/30 via-transparent to-blue-900/30 z-0" style={{ minHeight: '200vh' }} />
        
        {/* Subtle animated particles */}
        <div className="fixed inset-0 w-full h-full z-0" style={{ minHeight: '200vh' }}>
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/60 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 200}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <div className="text-white text-xl font-medium">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const handleViewChange = (newView: string) => {
    setSearchParams({ view: newView });
  };

  if (user) {
    return (
      <div className="relative">
        {/* Beautiful starry background - full page height */}
        <div 
          className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`,
            minHeight: '200vh'
          }}
        />
        
        {/* Gradient overlays for depth and readability */}
        <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-black/70 via-black/40 to-black/70 z-0" style={{ minHeight: '200vh' }} />
        <div className="fixed inset-0 w-full h-full bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20 z-0" style={{ minHeight: '200vh' }} />
        
        {/* Subtle animated particles */}
        <div className="fixed inset-0 w-full h-full z-0" style={{ minHeight: '200vh' }}>
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 200}%`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 pb-20 md:pb-0">
          <Navbar />
          
          {/* View Toggle for Logged In Users */}
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => handleViewChange('dashboard')}
                variant={view === 'dashboard' ? 'default' : 'outline'}
                className="flex items-center space-x-2 bg-black/20 backdrop-blur-sm border-white/20 hover:bg-black/30"
              >
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
              <Button
                onClick={() => handleViewChange('home')}
                variant={view === 'home' ? 'default' : 'outline'}
                className="flex items-center space-x-2 bg-black/20 backdrop-blur-sm border-white/20 hover:bg-black/30"
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
    <div className="relative">
      {/* Beautiful starry background - full page height */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`,
          minHeight: '200vh'
        }}
      />
      
      {/* Gradient overlays for depth and readability */}
      <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-black/60 via-black/30 to-black/70 z-0" style={{ minHeight: '200vh' }} />
      <div className="fixed inset-0 w-full h-full bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20 z-0" style={{ minHeight: '200vh' }} />
      
      {/* Subtle animated particles */}
      <div className="fixed inset-0 w-full h-full z-0" style={{ minHeight: '200vh' }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 200}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
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
