
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateListingModal from './CreateListingModal';
import EditListingModal from './EditListingModal';
import DiscordImportModal from './DiscordImportModal';
import LoadingSpinner from './LoadingSpinner';
import { 
  Plus, 
  Edit, 
  Eye, 
  TrendingUp, 
  Users, 
  Calendar,
  Star,
  Trash2,
  Download
} from 'lucide-react';

type Listing = Database['public']['Tables']['listings']['Row'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [discordImportModalOpen, setDiscordImportModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [stats, setStats] = useState({
    totalListings: 0,
    totalViews: 0,
    totalBumps: 0,
    totalJoins: 0,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchListings();
  }, [user, navigate]);

  const fetchListings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setListings(data || []);
      
      // Calculate stats
      const totalListings = data?.length || 0;
      const totalViews = data?.reduce((sum, listing) => sum + (listing.view_count || 0), 0) || 0;
      const totalBumps = data?.reduce((sum, listing) => sum + (listing.bump_count || 0), 0) || 0;
      const totalJoins = data?.reduce((sum, listing) => sum + (listing.join_count || 0), 0) || 0;
      
      setStats({ totalListings, totalViews, totalBumps, totalJoins });
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch your listings.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (listing: Listing) => {
    setSelectedListing(listing);
    setEditModalOpen(true);
  };

  const handleDelete = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Listing deleted successfully.',
      });
      
      fetchListings();
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete listing.',
      });
    }
  };

  const handleBump = async (listing: Listing) => {
    if (!user) return;

    try {
      // Check if user can bump (2 hour cooldown)
      const { data: cooldown } = await supabase
        .from('bump_cooldowns')
        .select('last_bump_at')
        .eq('user_discord_id', user.id)
        .eq('listing_id', listing.id)
        .single();

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      if (cooldown && new Date(cooldown.last_bump_at) > twoHoursAgo) {
        const nextBumpTime = new Date(new Date(cooldown.last_bump_at).getTime() + 2 * 60 * 60 * 1000);
        const timeLeft = nextBumpTime.getTime() - now.getTime();
        const hours = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        
        toast({
          variant: 'destructive',
          title: 'Cooldown Active',
          description: `You can bump again in ${hours}h ${minutes}m.`,
        });
        return;
      }

      // Update cooldown
      await supabase
        .from('bump_cooldowns')
        .upsert({
          user_discord_id: user.id,
          listing_id: listing.id,
          last_bump_at: now.toISOString(),
        });

      // Update listing
      const { error } = await supabase
        .from('listings')
        .update({
          last_bumped_at: now.toISOString(),
          bump_count: (listing.bump_count || 0) + 1,
          updated_at: now.toISOString(),
        })
        .eq('id', listing.id);

      if (error) throw error;

      // Create bump record
      await supabase
        .from('bumps')
        .insert({
          listing_id: listing.id,
          user_id: user.id,
          bump_type: 'manual',
          bumped_at: now.toISOString(),
        });

      toast({
        title: 'Success',
        description: 'Listing bumped successfully! Next bump available in 2 hours.',
      });
      
      fetchListings();
    } catch (error: any) {
      console.error('Error bumping listing:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to bump listing.',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, label: 'Pending' },
      active: { variant: 'default' as const, label: 'Active' },
      suspended: { variant: 'destructive' as const, label: 'Suspended' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <div className="text-white text-xl">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Manage your server listings and track performance</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setDiscordImportModalOpen(true)}
              variant="outline"
              className="border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Import from Discord
            </Button>
            <Button 
              onClick={() => setCreateModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Listings</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalListings}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Bumps</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalBumps}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Joins</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalJoins}</div>
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        <Card className="bg-[#1A1A1A] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white">Your Listings</CardTitle>
            <CardDescription className="text-gray-400">
              Manage and track your server listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">You haven't created any listings yet.</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button 
                    onClick={() => setDiscordImportModalOpen(true)}
                    variant="outline"
                    className="border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Import from Discord
                  </Button>
                  <Button 
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Listing
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div key={listing.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-[#0F0F0F] rounded-lg border border-[#333] space-y-4 lg:space-y-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-white text-lg">{listing.name}</h3>
                        {listing.featured && <Star className="h-4 w-4 text-yellow-500" />}
                        {getStatusBadge(listing.status)}
                      </div>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{listing.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {listing.member_count || 0} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {listing.view_count || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {listing.bump_count || 0} bumps
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBump(listing)}
                        className="border-[#333] text-white hover:bg-[#333]"
                      >
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Bump
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(listing)}
                        className="border-[#333] text-white hover:bg-[#333]"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(listing.id)}
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        <CreateListingModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={fetchListings}
        />
        
        {selectedListing && (
          <EditListingModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            listing={selectedListing}
            onSuccess={() => {
              fetchListings();
              setSelectedListing(null);
            }}
          />
        )}

        <DiscordImportModal
          open={discordImportModalOpen}
          onOpenChange={setDiscordImportModalOpen}
          onImportComplete={fetchListings}
        />
      </div>
    </div>
  );
};

export default Dashboard;
