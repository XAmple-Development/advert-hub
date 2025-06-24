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
  Activity,
  Zap,
  Crown
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="relative">
            <LoadingSpinner size="lg" className="text-purple-400" />
            <div className="absolute inset-0 animate-ping">
              <LoadingSpinner size="lg" className="text-purple-300 opacity-20" />
            </div>
          </div>
          <div className="text-center">
            <div className="text-white text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Loading Dashboard
            </div>
            <div className="text-gray-300 text-lg">Setting up your workspace...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Enhanced Header */}
        <div className="mb-16">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-6 backdrop-blur-sm">
                <Star className="h-4 w-4 text-purple-300" />
                <span className="text-purple-200 font-medium">Premium Dashboard</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-white mb-6">
                Your
                <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl leading-relaxed">
                Command center for your Discord empire. Monitor, manage, and maximize your community growth.
              </p>
              <div className="flex items-center gap-3 text-gray-400">
                <Activity className="h-5 w-5 text-cyan-400" />
                <span className="text-lg">Real-time analytics and insights</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => setDiscordImportModalOpen(true)}
                size="lg"
                className="group bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 text-white hover:scale-105 transition-all duration-300 rounded-2xl px-8 py-4"
              >
                <Download className="h-5 w-5 mr-3 text-purple-400 group-hover:text-purple-300" />
                Import from Discord
              </Button>
              <Button 
                onClick={() => setCreateModalOpen(true)}
                size="lg"
                className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 rounded-2xl px-8 py-4"
              >
                <Plus className="h-5 w-5 mr-3" />
                Create New Listing
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                Total Listings
              </CardTitle>
              <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black text-white mb-2">{stats.totalListings}</div>
              <div className="text-sm text-gray-400">Active communities</div>
            </CardContent>
            <Sparkles className="absolute top-4 right-4 h-4 w-4 text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Card>
          
          <Card className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-green-500/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                Total Views
              </CardTitle>
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Eye className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black text-white mb-2">{stats.totalViews.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Profile visits</div>
            </CardContent>
            <Sparkles className="absolute top-4 right-4 h-4 w-4 text-green-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Card>
          
          <Card className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                Total Bumps
              </CardTitle>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black text-white mb-2">{stats.totalBumps}</div>
              <div className="text-sm text-gray-400">Promotions sent</div>
            </CardContent>
            <Sparkles className="absolute top-4 right-4 h-4 w-4 text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Card>
          
          <Card className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-orange-500/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">
                Total Joins
              </CardTitle>
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-black text-white mb-2">{stats.totalJoins}</div>
              <div className="text-sm text-gray-400">New members</div>
            </CardContent>
            <Sparkles className="absolute top-4 right-4 h-4 w-4 text-orange-300 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </Card>
        </div>

        {/* Enhanced Listings Section */}
        <Card className="relative bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
          <CardHeader className="relative z-10 border-b border-gray-700/50 p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-2xl font-bold">Your Server Listings</CardTitle>
                <CardDescription className="text-gray-300 text-lg">
                  Manage and optimize your Discord server presence
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 p-8">
            {listings.length === 0 ? (
              <div className="text-center py-20">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full mb-6">
                    <Plus className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-4 mb-10">
                  <h3 className="text-3xl font-bold text-white">No listings yet</h3>
                  <p className="text-gray-300 text-xl max-w-lg mx-auto leading-relaxed">
                    Start growing your Discord community by creating your first server listing or importing from Discord.
                  </p>
                </div>
                <div className="flex flex-wrap gap-6 justify-center">
                  <Button 
                    onClick={() => setDiscordImportModalOpen(true)}
                    size="lg"
                    className="group bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 text-white hover:scale-105 transition-all duration-300 rounded-2xl px-8 py-4"
                  >
                    <Download className="h-5 w-5 mr-3 text-purple-400 group-hover:text-purple-300" />
                    Import from Discord
                  </Button>
                  <Button 
                    onClick={() => setCreateModalOpen(true)}
                    size="lg"
                    className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 rounded-2xl px-8 py-4"
                  >
                    <Plus className="h-5 w-5 mr-3" />
                    Create Your First Listing
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {listings.map((listing) => (
                  <div key={listing.id} className="group">
                    <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 rounded-3xl overflow-hidden transform hover:scale-[1.02] hover:-translate-y-1">
                      <CardContent className="p-8">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                          <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-4 flex-wrap">
                              <h3 className="font-bold text-white text-2xl group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                                {listing.name}
                              </h3>
                              {listing.featured && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full backdrop-blur-sm">
                                  <Star className="h-4 w-4 text-yellow-400" />
                                  <span className="text-sm text-yellow-300 font-medium">Featured</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full backdrop-blur-sm">
                                <Crown className="h-3 w-3 text-purple-400" />
                                <span className="text-xs text-purple-300 font-medium">{getStatusBadge(listing.status)}</span>
                              </div>
                            </div>
                            
                            <p className="text-gray-300 text-lg leading-relaxed line-clamp-2">
                              {listing.description}
                            </p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="flex items-center gap-3 text-gray-400 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl px-4 py-3 border border-gray-700/30">
                                <Users className="h-5 w-5 text-cyan-400" />
                                <div>
                                  <div className="text-white font-bold text-lg">{listing.member_count || 0}</div>
                                  <div className="text-xs text-gray-500">members</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-gray-400 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl px-4 py-3 border border-gray-700/30">
                                <Eye className="h-5 w-5 text-green-400" />
                                <div>
                                  <div className="text-white font-bold text-lg">{listing.view_count || 0}</div>
                                  <div className="text-xs text-gray-500">views</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-gray-400 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl px-4 py-3 border border-gray-700/30">
                                <TrendingUp className="h-5 w-5 text-purple-400" />
                                <div>
                                  <div className="text-white font-bold text-lg">{listing.bump_count || 0}</div>
                                  <div className="text-xs text-gray-500">bumps</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-gray-400 bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl px-4 py-3 border border-gray-700/30">
                                <Calendar className="h-5 w-5 text-orange-400" />
                                <div>
                                  <div className="text-white font-bold text-sm">
                                    {new Date(listing.created_at).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-500">created</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
                            <Button
                              size="lg"
                              onClick={() => handleBump(listing)}
                              className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl px-6 py-3"
                            >
                              <Zap className="h-5 w-5 mr-2" />
                              Bump
                            </Button>
                            <Button
                              size="lg"
                              variant="outline"
                              onClick={() => handleEdit(listing)}
                              className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-cyan-500/50 text-gray-300 hover:text-white transition-all duration-300 rounded-2xl px-6 py-3"
                            >
                              <Edit className="h-5 w-5 mr-2" />
                              Edit
                            </Button>
                            <Button
                              size="lg"
                              variant="outline"
                              onClick={() => handleDelete(listing.id)}
                              className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 rounded-2xl px-6 py-3"
                            >
                              <Trash2 className="h-5 w-5 mr-2" />
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
