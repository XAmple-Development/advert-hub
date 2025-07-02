
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Home, Globe } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || (user ? 'dashboard' : 'home');

  console.log('Index: Rendering with loading:', loading, 'user:', !!user);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2C2F33] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
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
      <div className="min-h-screen bg-[#2C2F33] pb-20 md:pb-0">
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
            <Features />
            <HowItWorks />
            <PremiumFeatures />
            <Pricing />
            <Footer />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2C2F33]">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <PremiumFeatures />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
