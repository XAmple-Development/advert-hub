import { useParams, Link } from 'react-router-dom';
import { UserProfile } from '@/components/social/UserProfile';
import { FollowersFollowingList } from '@/components/social/FollowersFollowingList';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
            <p className="text-gray-300">The profile you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        {isOwnProfile && (
          <div className="flex justify-end">
            <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
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
    </div>
  );
}