import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ModerationDashboard from '@/components/moderation/ModerationDashboard';
import { Shield } from 'lucide-react';

const Moderation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-500" />
            Moderation Dashboard
          </h1>
          <p className="text-gray-300 text-lg">
            Manage content flags, user warnings, and moderation actions
          </p>
        </div>

        <ModerationDashboard />
      </div>
    </div>
  );
};

export default Moderation;