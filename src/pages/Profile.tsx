import { useParams } from 'react-router-dom';
import { UserProfile } from '@/components/social/UserProfile';
import { FollowersFollowingList } from '@/components/social/FollowersFollowingList';
import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <UserProfile userId={userId} showFollowButton={!isOwnProfile} />
      <FollowersFollowingList userId={userId} />
    </div>
  );
}