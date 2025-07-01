
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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

const Index = () => {
  const { user, loading } = useAuth();

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

  if (user) {
    return (
      <div className="min-h-screen bg-[#2C2F33] pb-20 md:pb-0">
        <Navbar />
        <Dashboard />
        <AdminUpgrade />
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
