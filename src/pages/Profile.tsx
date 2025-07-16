import { useParams, Link } from 'react-router-dom';
import { UserProfile } from '@/components/social/UserProfile';
import { FollowersFollowingList } from '@/components/social/FollowersFollowingList';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ModernLayout from '@/components/layout/ModernLayout';

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  if (!userId) {
    return (
      <ModernLayout>
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
            <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
          </div>
        </div>
      </ModernLayout>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <ModernLayout>
      <Navbar />
      <div className="container mx-auto px-6 py-8 space-y-8">
        {isOwnProfile && (
          <div className="flex justify-end">
            <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
              <Link to="/profile/edit">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>
        )}
        
        <UserProfile userId={userId} showFollowButton={!isOwnProfile} />
        <FollowersFollowingList userId={userId} />
      </div>
    </ModernLayout>
  );
}