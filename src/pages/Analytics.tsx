import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ModernCard from '@/components/ui/modern-card';
import ModernLayout from '@/components/layout/ModernLayout';
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
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
    <ModernLayout>
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">Track your listing performance and growth</p>
        </div>

          {/* Time Range Selector */}
          <div className="mb-8">
            <Tabs value={timeRange} onValueChange={setTimeRange} className="w-fit">
              <TabsList className="bg-card/50 border-border/50">
                <TabsTrigger value="7d" className="text-muted-foreground data-[state=active]:text-foreground">Last 7 days</TabsTrigger>
                <TabsTrigger value="30d" className="text-muted-foreground data-[state=active]:text-foreground">Last 30 days</TabsTrigger>
                <TabsTrigger value="90d" className="text-muted-foreground data-[state=active]:text-foreground">Last 90 days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-foreground text-xl">Loading analytics...</div>
            </div>
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <ModernCard variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-muted-foreground text-sm font-medium">Total Views</h3>
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-foreground text-3xl font-bold">{totalViews.toLocaleString()}</div>
                </ModernCard>

                <ModernCard variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-muted-foreground text-sm font-medium">Total Joins</h3>
                    <UserPlus className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="text-foreground text-3xl font-bold">{totalJoins.toLocaleString()}</div>
                </ModernCard>

                <ModernCard variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-muted-foreground text-sm font-medium">Total Bumps</h3>
                    <Target className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-foreground text-3xl font-bold">{totalBumps}</div>
                </ModernCard>

                <ModernCard variant="glass" className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-muted-foreground text-sm font-medium">Avg Conversion</h3>
                    <Award className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="text-foreground text-3xl font-bold">{avgConversion.toFixed(1)}%</div>
                </ModernCard>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ModernCard variant="glass" className="p-6">
                  <div className="mb-6">
                    <h2 className="text-foreground text-xl font-bold flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Views & Joins Over Time
                    </h2>
                  </div>
                  <div>
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
                  </div>
                </ModernCard>

                <ModernCard variant="glass" className="p-6">
                  <div className="mb-6">
                    <h2 className="text-foreground text-xl font-bold flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Listing Performance
                    </h2>
                  </div>
                  <div>
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
                  </div>
                </ModernCard>
              </div>

              {/* Listing Summaries */}
              <ModernCard variant="glass" className="p-6">
                <div className="mb-6">
                  <h2 className="text-foreground text-xl font-bold">Listing Performance Summary</h2>
                </div>
                <div className="space-y-4">
                  {listingSummaries.map(listing => (
                    <div key={listing.id} className="flex items-center justify-between p-4 bg-card/30 border border-border/20 rounded-xl">
                      <div>
                        <h3 className="text-foreground font-semibold">{listing.name}</h3>
                        <p className="text-muted-foreground text-sm">
                          {listing.total_views} views • {listing.total_joins} joins • {listing.conversion_rate.toFixed(1)}% conversion
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {listing.total_views > 0 && (
                          <Badge 
                            variant="outline" 
                            className="text-primary border-primary/50 bg-primary/10"
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {listingSummaries.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No listings found. Create your first listing to see analytics!</p>
                    </div>
                  )}
                </div>
              </ModernCard>
            </>
          )}
      </div>
    </ModernLayout>
  );
};

export default Analytics;