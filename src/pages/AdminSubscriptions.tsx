import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Filter,
  Star,
  Crown,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  email: string;
  stripe_customer_id: string;
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string | null;
  updated_at: string;
  profiles: {
    username: string;
    discord_username: string;
  } | null;
}

interface Stats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  goldSubscriptions: number;
  platinumSubscriptions: number;
  premiumSubscriptions: number;
}

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    goldSubscriptions: 0,
    platinumSubscriptions: 0,
    premiumSubscriptions: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Fetch all subscriptions with user profiles
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscribers')
        .select(`
          *,
          profiles (
            username,
            discord_username
          )
        `)
        .order('updated_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;

      setSubscriptions((subscriptionsData || []) as any);

      // Calculate stats
      const totalSubs = subscriptionsData?.length || 0;
      const activeSubs = subscriptionsData?.filter(sub => sub.subscribed).length || 0;
      const goldSubs = subscriptionsData?.filter(sub => sub.subscription_tier === 'gold').length || 0;
      const platinumSubs = subscriptionsData?.filter(sub => sub.subscription_tier === 'platinum').length || 0;
      const premiumSubs = subscriptionsData?.filter(sub => sub.subscription_tier === 'premium').length || 0;
      
      // Calculate monthly revenue
      const monthlyRevenue = (goldSubs * 4.79) + (platinumSubs * 9.59) + (premiumSubs * 12.99);

      setStats({
        totalSubscriptions: totalSubs,
        activeSubscriptions: activeSubs,
        monthlyRevenue,
        goldSubscriptions: goldSubs,
        platinumSubscriptions: platinumSubs,
        premiumSubscriptions: premiumSubs
      });

    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load subscription data",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (subscribed: boolean, subscriptionEnd: string | null) => {
    if (!subscribed) {
      return <Badge variant="secondary" className="bg-gray-500"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
    }
    
    if (subscriptionEnd && new Date(subscriptionEnd) < new Date()) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    }
    
    return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'gold':
        return <Badge className="bg-yellow-600"><Star className="h-3 w-3 mr-1" />Gold</Badge>;
      case 'platinum':
        return <Badge className="bg-slate-600"><Crown className="h-3 w-3 mr-1" />Platinum</Badge>;
      case 'premium':
        return <Badge className="bg-purple-600"><Crown className="h-3 w-3 mr-1" />Premium</Badge>;
      default:
        return <Badge variant="outline">Free</Badge>;
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchTerm || 
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles?.discord_username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTier = filterTier === 'all' || sub.subscription_tier === filterTier;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && sub.subscribed) ||
      (filterStatus === 'inactive' && !sub.subscribed);

    return matchesSearch && matchesTier && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground">Manage and monitor user subscriptions</p>
        </div>
        <Button onClick={fetchSubscriptions}>Refresh Data</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSubscriptions > 0 ? 
                ((stats.activeSubscriptions / stats.totalSubscriptions) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Tiers</CardTitle>
          <CardDescription>Breakdown by subscription tier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">{stats.goldSubscriptions}</div>
              <div className="text-sm text-muted-foreground">Gold Subscriptions</div>
            </div>
            <div className="text-center p-4 bg-slate-50 dark:bg-slate-950 rounded-lg">
              <Crown className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-slate-600">{stats.platinumSubscriptions}</div>
              <div className="text-sm text-muted-foreground">Platinum Subscriptions</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{stats.premiumSubscriptions}</div>
              <div className="text-sm text-muted-foreground">Premium Subscriptions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription List</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email, username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No subscriptions found matching your criteria
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {subscription.profiles?.username || 'Unknown User'}
                          </div>
                          {subscription.profiles?.discord_username && (
                            <div className="text-sm text-muted-foreground">
                              @{subscription.profiles.discord_username}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {subscription.email}
                      </TableCell>
                      <TableCell>
                        {getTierBadge(subscription.subscription_tier)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(subscription.subscribed, subscription.subscription_end)}
                      </TableCell>
                      <TableCell>
                        {subscription.subscription_end ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(subscription.subscription_end).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(subscription.updated_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSubscriptions;