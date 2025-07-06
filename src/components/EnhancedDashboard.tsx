
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import StatsCards from './StatsCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  TrendingUp, 
  Eye, 
  Users, 
  Server, 
  Bot,
  ExternalLink,
  Clock
} from 'lucide-react';
import CrossPromotionNetwork from './CrossPromotionNetwork';

interface DashboardStats {
  totalListings: number;
  totalServers: number;
  totalBots: number;
  totalViews: number;
  totalBumpsToday: number;
  userListings: any[];
  recentActivity: any[];
}

const EnhancedDashboard = () => {
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalListings: 0,
    totalServers: 0,
    totalBots: 0,
    totalViews: 0,
    totalBumpsToday: 0,
    userListings: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's listings only
      const { data: userListings } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Fetch bumps for user's listings only
      const userListingIds = userListings?.map(l => l.id) || [];
      
      const { data: todayBumps } = await supabase
        .from('bumps')
        .select('id')
        .in('listing_id', userListingIds)
        .gte('bumped_at', new Date().toISOString().split('T')[0]);

      // Fetch recent activity for user's listings only - include all bump types
      const { data: recentBumps } = await supabase
        .from('bumps')
        .select(`
          id,
          bumped_at,
          bump_type,
          listings (
            name,
            type
          )
        `)
        .in('listing_id', userListingIds)
        .order('bumped_at', { ascending: false })
        .limit(10);

      const totalListings = userListings?.length || 0;
      const totalServers = userListings?.filter(l => l.type === 'server').length || 0;
      const totalBots = userListings?.filter(l => l.type === 'bot').length || 0;
      const totalViews = userListings?.reduce((sum, l) => sum + (l.view_count || 0), 0) || 0;
      const totalBumpsToday = todayBumps?.length || 0;

      const recentActivity = recentBumps?.map(bump => ({
        id: bump.id,
        type: 'bump' as const,
        listingName: (bump.listings as any)?.name || 'Unknown',
        listingType: (bump.listings as any)?.type || 'server',
        timestamp: bump.bumped_at,
        bumpType: bump.bump_type || 'manual'
      })) || [];

      setStats({
        totalListings,
        totalServers,
        totalBots,
        totalViews,
        totalBumpsToday,
        userListings: userListings || [],
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const canBumpListing = (lastBumped: string | null) => {
    if (!lastBumped) return true;
    const lastBumpTime = new Date(lastBumped);
    const now = new Date();
    const timeDiff = now.getTime() - lastBumpTime.getTime();
    const cooldownMs = isPremium ? 2 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000; // 2 hours for premium, 6 for free
    return timeDiff >= cooldownMs;
  };

  const getTimeUntilNextBump = (lastBumped: string | null) => {
    if (!lastBumped) return null;
    const lastBumpTime = new Date(lastBumped);
    const now = new Date();
    const timeDiff = now.getTime() - lastBumpTime.getTime();
    const cooldownMs = isPremium ? 2 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000; // 2 hours for premium, 6 for free
    
    if (timeDiff >= cooldownMs) return null;
    
    const timeLeft = cooldownMs - timeDiff;
    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            Welcome to your Dashboard, {user?.user_metadata?.full_name || user?.email}!
          </h1>
          <p className="text-gray-300 text-lg">
            Here's your overview.
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalListings={stats.totalListings}
          totalServers={stats.totalServers}
          totalBots={stats.totalBots}
          totalViews={stats.totalViews}
          totalBumpsToday={stats.totalBumpsToday}
          recentActivity={stats.recentActivity}
          loading={loading}
        />

        {/* User's Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                <Server className="h-5 w-5 text-purple-400" />
                Your Communities
              </CardTitle>
              <Button
                onClick={() => navigate('/listings')}
                variant="outline"
                size="sm"
                className="border-purple-500/50 text-purple-300 hover:bg-purple-600 hover:text-white rounded-xl"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New
              </Button>
            </CardHeader>
            <CardContent>
              {stats.userListings.length > 0 ? (
                <div className="space-y-4">
                  {stats.userListings.slice(0, 5).map((listing) => (
                    <div key={listing.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-2xl border border-gray-700/30">
                      <div className="flex items-center gap-3">
                        {listing.avatar_url ? (
                          <img src={listing.avatar_url} alt={listing.name} className="w-10 h-10 rounded-xl" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                            {listing.type === 'server' ? <Server className="h-5 w-5 text-white" /> : <Bot className="h-5 w-5 text-white" />}
                          </div>
                        )}
                        <div>
                          <div className="text-white font-semibold">{listing.name}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Badge variant="outline" className="text-xs">{listing.type}</Badge>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {listing.view_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {listing.bump_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canBumpListing(listing.last_bumped_at) ? (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            Can Bump
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-300 border-orange-500/30">
                            <Clock className="h-3 w-3 mr-1" />
                            {getTimeUntilNextBump(listing.last_bumped_at)}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/listings/${listing.id}`)}
                          className="text-gray-400 hover:text-white"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {stats.userListings.length > 5 && (
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/listings')}
                      className="w-full text-purple-300 hover:text-white hover:bg-purple-600/20"
                    >
                      View All {stats.userListings.length} Communities
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Server className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <div className="text-gray-400 mb-4">You haven't created any listings yet</div>
                  <Button
                    onClick={() => navigate('/listings')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Listing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-white text-xl font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => navigate('/listings')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-6 rounded-2xl text-lg"
              >
                <Server className="h-5 w-5 mr-2" />
                Browse All Communities
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://discord.gg/3mNGT2AwNy', '_blank')}
                className="w-full border-2 border-gray-700/50 bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white py-6 rounded-2xl text-lg"
              >
                <Users className="h-5 w-5 mr-2" />
                Join Support Server
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/listings')}
                  className="border-blue-500/50 text-blue-300 hover:bg-blue-600/20 rounded-xl"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Advert Listings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cross-Promotion Network for Premium Users */}
        <div className="mt-8">
          <CrossPromotionNetwork />
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
