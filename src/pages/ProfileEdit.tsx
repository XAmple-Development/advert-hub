import { Navigate } from 'react-router-dom';
import { ProfileEdit } from '@/components/profile/ProfileEdit';
import { AutoBumpSettings } from '@/components/AutoBumpSettings';
import { useAuth } from '@/hooks/useAuth';
import { EnhancedLoadingSpinner } from '@/components/enhanced/EnhancedLoadingStates';
import Navbar from '@/components/Navbar';

export default function ProfileEditPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <EnhancedLoadingSpinner size="md" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <ProfileEdit />
          <AutoBumpSettings />
        </div>
      </div>
    </div>
  );
}