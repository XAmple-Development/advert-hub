import { Navigate } from 'react-router-dom';
import { ProfileEdit } from '@/components/profile/ProfileEdit';
import { useAuth } from '@/hooks/useAuth';
import { EnhancedLoadingSpinner } from '@/components/enhanced/EnhancedLoadingStates';

export default function ProfileEditPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <EnhancedLoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <ProfileEdit />
      </div>
    </div>
  );
}