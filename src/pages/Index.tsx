
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const { user, loading } = useAuth();

  console.log('Index component - User:', !!user, 'Loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2C2F33] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show dashboard if authenticated, otherwise show landing page
  if (user) {
    console.log('User authenticated, showing Dashboard');
    return <Dashboard />;
  }

  console.log('No user found, showing landing page');
  // Show the main landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-[#2C2F33]">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
