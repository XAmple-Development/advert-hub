import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  UserPlus, 
  Globe, 
  Clock,
  Target,
  Award
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Line, Bar } from 'recharts';
import { 
  LineChart, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  listing_id: string;
  listing_name: string;
  date: string;
  views: number;
  joins: number;
  bumps: number;
  unique_visitors: number;
  geographic_data: any;
  referrer_data: any;
}

interface ListingSummary {
  id: string;
  name: string;
  total_views: number;
  total_joins: number;
  total_bumps: number;
  conversion_rate: number;
  trend: 'up' | 'down' | 'stable';
}

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [listingSummaries, setListingSummaries] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Get user's listings first
      const { data: listings } = await supabase
        .from('listings')
        .select('id, name')
        .eq('user_id', user?.id);

      if (!listings?.length) {
        setLoading(false);
        return;
      }

      const listingIds = listings.map(l => l.id);
      
      // Calculate date range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch analytics data
      const { data: analyticsData } = await supabase
        .from('listing_analytics')
        .select('*')
        .in('listing_id', listingIds)
        .gte('date', startDate.toISOString().split('T')[0]);

      // Join with listing names
      const enrichedData = analyticsData?.map(item => ({
        ...item,
        listing_name: listings.find(l => l.id === item.listing_id)?.name || 'Unknown'
      })) || [];

      setAnalytics(enrichedData);

      // Calculate summaries
      const summaries: ListingSummary[] = listings.map(listing => {
        const listingData = enrichedData.filter(d => d.listing_id === listing.id);
        const total_views = listingData.reduce((sum, d) => sum + (d.views || 0), 0);
        const total_joins = listingData.reduce((sum, d) => sum + (d.joins || 0), 0);
        const total_bumps = listingData.reduce((sum, d) => sum + (d.bumps || 0), 0);
        
        return {
          id: listing.id,
          name: listing.name,
          total_views,
          total_joins,
          total_bumps,
          conversion_rate: total_views > 0 ? (total_joins / total_views) * 100 : 0,
          trend: 'stable' as const // TODO: Calculate actual trend
        };
      });

      setListingSummaries(summaries);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const chartData = analytics.reduce((acc, item) => {
    const existingDate = acc.find(d => d.date === item.date);
    if (existingDate) {
      existingDate.views += item.views || 0;
      existingDate.joins += item.joins || 0;
      existingDate.bumps += item.bumps || 0;
    } else {
      acc.push({
        date: item.date,
        views: item.views || 0,
        joins: item.joins || 0,
        bumps: item.bumps || 0
      });
    }
    return acc;
  }, [] as any[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalViews = listingSummaries.reduce((sum, l) => sum + l.total_views, 0);
  const totalJoins = listingSummaries.reduce((sum, l) => sum + l.total_joins, 0);
  const totalBumps = listingSummaries.reduce((sum, l) => sum + l.total_bumps, 0);
  const avgConversion = listingSummaries.length > 0 
    ? listingSummaries.reduce((sum, l) => sum + l.conversion_rate, 0) / listingSummaries.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <Navbar />
      
      <div className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white mb-4">Analytics Dashboard</h1>
            <p className="text-gray-300 text-lg">Track your listing performance and growth</p>
          </div>

          {/* Time Range Selector */}
          <div className="mb-8">
            <Tabs value={timeRange} onValueChange={setTimeRange} className="w-fit">
              <TabsList className="bg-gray-800/50 border-gray-700/50">
                <TabsTrigger value="7d" className="text-gray-300">Last 7 days</TabsTrigger>
                <TabsTrigger value="30d" className="text-gray-300">Last 30 days</TabsTrigger>
                <TabsTrigger value="90d" className="text-gray-300">Last 90 days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-white text-xl">Loading analytics...</div>
            </div>
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-gray-300 text-sm font-medium">Total Views</CardTitle>
                      <Eye className="h-5 w-5 text-green-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-white text-3xl font-bold">{totalViews.toLocaleString()}</div>
                    <Badge variant="outline" className="mt-2 text-green-400 border-green-400/50">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12.5%
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-gray-300 text-sm font-medium">Total Joins</CardTitle>
                      <UserPlus className="h-5 w-5 text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-white text-3xl font-bold">{totalJoins.toLocaleString()}</div>
                    <Badge variant="outline" className="mt-2 text-blue-400 border-blue-400/50">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8.2%
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-gray-300 text-sm font-medium">Total Bumps</CardTitle>
                      <Target className="h-5 w-5 text-purple-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-white text-3xl font-bold">{totalBumps}</div>
                    <Badge variant="outline" className="mt-2 text-purple-400 border-purple-400/50">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15.7%
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-gray-300 text-sm font-medium">Avg Conversion</CardTitle>
                      <Award className="h-5 w-5 text-orange-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-white text-3xl font-bold">{avgConversion.toFixed(1)}%</div>
                    <Badge variant="outline" className="mt-2 text-orange-400 border-orange-400/50">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +2.1%
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Views & Joins Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }} 
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="views" 
                          stroke="#10B981" 
                          strokeWidth={2}
                          name="Views"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="joins" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          name="Joins"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Listing Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={listingSummaries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9CA3AF"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="total_views" fill="#10B981" name="Views" />
                        <Bar dataKey="total_joins" fill="#3B82F6" name="Joins" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Listing Summaries */}
              <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Listing Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {listingSummaries.map(listing => (
                      <div key={listing.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                        <div>
                          <h3 className="text-white font-semibold">{listing.name}</h3>
                          <p className="text-gray-400 text-sm">
                            {listing.total_views} views • {listing.total_joins} joins • {listing.conversion_rate.toFixed(1)}% conversion
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant="outline" 
                            className="text-green-400 border-green-400/50"
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Growing
                          </Badge>
                        </div>
                      </div>
                    ))}
                    
                    {listingSummaries.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No listings found. Create your first listing to see analytics!</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;