
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Crown, Users, TrendingUp, LogOut } from 'lucide-react';
import CreateListingModal from './CreateListingModal';

interface Listing {
  id: string;
  name: string;
  description: string;
  type: 'server' | 'bot';
  status: 'active' | 'pending' | 'suspended';
  member_count: number;
  view_count: number;
  bump_count: number;
  created_at: string;
}

interface Profile {
  username: string;
  subscription_tier: 'free' | 'premium';
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchListings();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('username, subscription_tier')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile",
      });
    }
  };

  const fetchListings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load listings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2C2F33] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2C2F33]">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {profile?.username || 'User'}!
            </h1>
            <div className="flex items-center gap-2">
              <Badge className={`${profile?.subscription_tier === 'premium' ? 'bg-yellow-500' : 'bg-gray-500'} text-white`}>
                {profile?.subscription_tier === 'premium' ? (
                  <>
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </>
                ) : (
                  'Free'
                )}
              </Badge>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="outline" className="border-gray-400 text-gray-300 hover:bg-gray-800">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#36393F] border-[#40444B]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Listings</CardTitle>
              <Users className="h-4 w-4 text-[#5865F2]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{listings.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#36393F] border-[#40444B]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#5865F2]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {listings.reduce((sum, listing) => sum + listing.view_count, 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#36393F] border-[#40444B]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Bumps</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#5865F2]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {listings.reduce((sum, listing) => sum + listing.bump_count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Your Listings</h2>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Listing
          </Button>
        </div>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <Card className="bg-[#36393F] border-[#40444B] text-center py-12">
            <CardContent>
              <div className="text-gray-400 mb-4">No listings yet</div>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                Create Your First Listing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id} className="bg-[#36393F] border-[#40444B]">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{listing.name}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {listing.type === 'server' ? 'Discord Server' : 'Discord Bot'}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(listing.status)}>
                      {listing.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4 line-clamp-2">{listing.description}</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="text-white font-semibold">{listing.member_count}</div>
                      <div className="text-gray-400">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold">{listing.view_count}</div>
                      <div className="text-gray-400">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white font-semibold">{listing.bump_count}</div>
                      <div className="text-gray-400">Bumps</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateListingModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
        onSuccess={fetchListings}
      />
    </div>
  );
};

export default Dashboard;
