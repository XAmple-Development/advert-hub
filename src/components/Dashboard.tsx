
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Server, Bot, Users, Eye, TrendingUp, LogOut, Download, Edit } from 'lucide-react';
import CreateListingModal from './CreateListingModal';
import DiscordImportModal from './DiscordImportModal';
import EditListingModal from './EditListingModal';
import { useNavigate } from 'react-router-dom';

interface Listing {
  id: string;
  type: 'server' | 'bot';
  name: string;
  description: string;
  long_description?: string;
  member_count: number;
  view_count: number;
  bump_count: number;
  status: string;
  created_at: string;
  avatar_url?: string;
  invite_url?: string;
  website_url?: string;
  support_server_url?: string;
}

interface Profile {
  username?: string;
  discord_username?: string;
}

const Dashboard = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, discord_username')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
    } catch (error: any) {
      console.error('fetchProfile error:', error);
    }
  };

  const fetchListings = async () => {
    console.log('Dashboard: fetchListings called for user:', user?.id);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('Dashboard: Query result:', { data, error, userID: user?.id });
      
      if (error) {
        console.error('Dashboard: Error fetching listings:', error);
        throw error;
      }
      
      console.log('Dashboard: Setting listings to:', data);
      setListings(data || []);
    } catch (error: any) {
      console.error('Dashboard: fetchListings error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch your listings",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('Dashboard: User found, fetching data...');
      fetchProfile();
      fetchListings();
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleBump = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('bumps')
        .insert({
          listing_id: listingId,
          user_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your listing has been bumped to the top!",
      });

      fetchListings();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleEditListing = (listing: Listing) => {
    setEditingListing(listing);
    setShowEditModal(true);
  };

  const handleImportComplete = () => {
    console.log('Dashboard: Import completed, refreshing listings...');
    setLoading(true);
    fetchListings();
  };

  const handleEditSuccess = () => {
    console.log('Dashboard: Edit completed, refreshing listings...');
    fetchListings();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2C2F33] flex items-center justify-center">
        <div className="text-white text-xl">Loading your dashboard...</div>
      </div>
    );
  }

  console.log('Dashboard: Rendering with listings:', listings);

  const displayName = profile?.username || profile?.discord_username || user?.email || 'User';

  return (
    <div className="min-h-screen bg-[#2C2F33]">
      <nav className="bg-[#36393F] border-b border-[#40444B] px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Discord Boost Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Welcome, {displayName}</span>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="border-[#40444B] text-gray-300 hover:bg-[#40444B]"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Your Listings</h2>
            <p className="text-gray-400">Manage your Discord servers and bots</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowImportModal(true)}
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Import Servers from Discord
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#57F287] hover:bg-[#3BA55C] text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </Button>
          </div>
        </div>

        {listings.length === 0 ? (
          <Card className="bg-[#36393F] border-[#40444B] text-center py-12">
            <CardContent>
              <div className="text-gray-400 mb-4">
                <Server className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">No listings yet</h3>
                <p>Get started by creating your first listing or importing from Discord</p>
                <p className="text-xs mt-2 text-gray-500">Debug: User ID: {user?.id}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setShowImportModal(true)}
                  className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Import from Discord
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#57F287] hover:bg-[#3BA55C] text-black"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <Card key={listing.id} className="bg-[#36393F] border-[#40444B] hover:border-[#5865F2] transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    {listing.avatar_url ? (
                      <img
                        src={listing.avatar_url}
                        alt={listing.name}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[#5865F2] rounded-full flex items-center justify-center">
                        {listing.type === 'server' ? (
                          <Server className="h-6 w-6 text-white" />
                        ) : (
                          <Bot className="h-6 w-6 text-white" />
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg">{listing.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={listing.type === 'server' ? 'default' : 'secondary'}>
                          {listing.type}
                        </Badge>
                        <Badge variant={listing.status === 'active' ? 'default' : 'destructive'}>
                          {listing.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-gray-300 line-clamp-2">
                    {listing.description}
                  </CardDescription>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-400 mb-1">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="text-white font-semibold">{listing.member_count || 0}</div>
                      <div className="text-gray-500 text-xs">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-400 mb-1">
                        <Eye className="h-4 w-4" />
                      </div>
                      <div className="text-white font-semibold">{listing.view_count || 0}</div>
                      <div className="text-gray-500 text-xs">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-400 mb-1">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="text-white font-semibold">{listing.bump_count || 0}</div>
                      <div className="text-gray-500 text-xs">Bumps</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEditListing(listing)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-[#40444B] text-gray-300 hover:bg-[#40444B]"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleBump(listing.id)}
                      className="flex-1 bg-[#5865F2] hover:bg-[#4752C4] text-white"
                      size="sm"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Bump
                    </Button>
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

      <DiscordImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImportComplete={handleImportComplete}
      />

      {editingListing && (
        <EditListingModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          listing={editingListing}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;
