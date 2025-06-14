
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';
import AuthForm from '@/components/AuthForm';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2C2F33] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!user) {
    return <AuthForm />;
  }

  // Show dashboard if authenticated
  return <Dashboard />;
};

export default Index;
