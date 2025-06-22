
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const authData = useAuth();

  console.log('Index page - Auth data:', authData);

  // Handle case where useAuth returns null or is loading
  if (!authData || authData.loading) {
    return (
      <div className="min-h-screen bg-[#2C2F33] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const { user } = authData;

  console.log('Index page - User:', user?.email || 'Not logged in');

  if (user) {
    return (
      <div className="min-h-screen bg-[#2C2F33]">
        <Navbar />
        <Dashboard />
      </div>
    );
  }

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
