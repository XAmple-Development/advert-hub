
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
  Download,
  Sparkles,
  BarChart3,
  Activity
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
    console.log('Dashboard: Auth state changed, user:', !!user);
    
    if (!user) {
      console.log('Dashboard: No user, redirecting to auth');
      navigate('/auth');
      return;
    }
    
    console.log('Dashboard: User found, fetching listings');
    fetchListings();
  }, [user]);

  const fetchListings = async () => {
    if (!user) {
      console.log('Dashboard: fetchListings called without user');
      return;
    }
    
    try {
      console.log('Dashboard: Starting to fetch listings...');
      setLoading(true);
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Dashboard: Error fetching listings:', error);
        throw error;
      }

      console.log('Dashboard: Successfully fetched listings:', data?.length || 0);
      setListings(data || []);
      
      // Calculate stats
      const totalListings = data?.length || 0;
      const totalViews = data?.reduce((sum, listing) => sum + (listing.view_count || 0), 0) || 0;
      const totalBumps = data?.reduce((sum, listing) => sum + (listing.bump_count || 0), 0) || 0;
      const totalJoins = data?.reduce((sum, listing) => sum + (listing.join_count || 0), 0) || 0;
      
      setStats({ totalListings, totalViews, totalBumps, totalJoins });
    } catch (error: any) {
      console.error('Dashboard: Error in fetchListings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch your listings.',
      });
    } finally {
      console.log('Dashboard: Setting loading to false');
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

  console.log('Dashboard: Rendering with loading:', loading, 'user:', !!user);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0F0F0F] to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <LoadingSpinner size="lg" className="text-blue-500" />
            <div className="absolute inset-0 animate-ping">
              <LoadingSpinner size="lg" className="text-blue-400 opacity-20" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl font-bold mb-2">Loading Dashboard</div>
            <div className="text-gray-400 text-sm">Setting up your workspace...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0F0F0F] to-gray-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Dashboard
                </h1>
              </div>
              <p className="text-gray-400 text-lg">
                Manage your server listings and track performance metrics
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Activity className="h-4 w-4" />
                <span>Real-time analytics and insights</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setDiscordImportModalOpen(true)}
                variant="outline"
                size="lg"
                className="bg-[#5865F2]/10 border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/20 hover:border-[#5865F2]/50 transition-all duration-200"
              >
                <Download className="h-5 w-5 mr-2" />
                Import from Discord
              </Button>
              <Button 
                onClick={() => setCreateModalOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Listing
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                Total Listings
              </CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalListings}</div>
              <div className="text-xs text-gray-500">Active servers</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:border-green-500/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                Total Views
              </CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                <Eye className="h-4 w-4 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalViews.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Profile visits</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                Total Bumps
              </CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                <TrendingUp className="h-4 w-4 text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalBumps}</div>
              <div className="text-xs text-gray-500">Promotions sent</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                Total Joins
              </CardTitle>
              <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <Users className="h-4 w-4 text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{stats.totalJoins}</div>
              <div className="text-xs text-gray-500">New members</div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Listings Section */}
        <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Your Server Listings</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage and optimize your Discord server presence
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {listings.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full mb-4">
                    <Plus className="h-10 w-10 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-3 mb-8">
                  <h3 className="text-xl font-semibold text-white">No listings yet</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Start growing your Discord community by creating your first server listing or importing from Discord.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button 
                    onClick={() => setDiscordImportModalOpen(true)}
                    variant="outline"
                    size="lg"
                    className="bg-[#5865F2]/10 border-[#5865F2]/30 text-[#5865F2] hover:bg-[#5865F2]/20 hover:border-[#5865F2]/50"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Import from Discord
                  </Button>
                  <Button 
                    onClick={() => setCreateModalOpen(true)}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Listing
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="group">
                    <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-bold text-white text-xl group-hover:text-blue-300 transition-colors">
                                {listing.name}
                              </h3>
                              {listing.featured && (
                                <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                                  <Star className="h-3 w-3 text-yellow-400" />
                                  <span className="text-xs text-yellow-300 font-medium">Featured</span>
                                </div>
                              )}
                              {getStatusBadge(listing.status)}
                            </div>
                            
                            <p className="text-gray-300 text-base leading-relaxed line-clamp-2">
                              {listing.description}
                            </p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg px-3 py-2">
                                <Users className="h-4 w-4 text-blue-400" />
                                <span className="text-white font-medium">{listing.member_count || 0}</span>
                                <span>members</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg px-3 py-2">
                                <Eye className="h-4 w-4 text-green-400" />
                                <span className="text-white font-medium">{listing.view_count || 0}</span>
                                <span>views</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg px-3 py-2">
                                <TrendingUp className="h-4 w-4 text-purple-400" />
                                <span className="text-white font-medium">{listing.bump_count || 0}</span>
                                <span>bumps</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-400 bg-gray-800/50 rounded-lg px-3 py-2">
                                <Calendar className="h-4 w-4 text-orange-400" />
                                <span className="text-white font-medium">
                                  {new Date(listing.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap">
                            <Button
                              size="sm"
                              onClick={() => handleBump(listing)}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                            >
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Bump
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(listing)}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(listing.id)}
                              className="border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
