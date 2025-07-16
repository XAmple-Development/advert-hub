import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ModernCard from '@/components/ui/modern-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AdminEventsManagement } from '@/components/admin/AdminEventsManagement';
import VerificationManagement from '@/components/admin/VerificationManagement';
import {
    Server,
    Bot,
    Check,
    X,
    Shield,
    Eye,
    Calendar,
    ExternalLink,
    AlertTriangle,
    Crown,
    Star,
    Sparkles,
    Users,
    TrendingUp,
    Activity,
    Settings,
    BarChart3,
    MessageSquare,
    Search,
    Filter,
    Download,
    Upload,
    Trash2,
    Edit,
    Plus,
    Zap,
    Target,
    Globe,
    DollarSign,
    UserCheck,
    UserX,
    Ban,
    Flag,
    Mail,
    Webhook,
    Database,
    Code,
    Terminal,
    RefreshCw,
    Award,
    Lock,
    Unlock,
    ArrowUp,
    ArrowDown,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Info,
    Megaphone,
    Bell,
    BellOff
} from 'lucide-react';

interface Listing {
    id: string;
    type: 'server' | 'bot';
    name: string;
    description: string;
    long_description?: string;
    status: string;
    created_at: string;
    avatar_url?: string;
    invite_url?: string;
    website_url?: string;
    discord_id: string;
    tags: string[];
    user_id: string;
    member_count?: number;
    vote_count?: number;
    view_count?: number;
    featured?: boolean;
    premium_featured?: boolean;
    verified_badge?: boolean;
}

interface AdminAction {
    id: string;
    action: string;
    reason?: string;
    created_at: string;
    listing_id: string;
    admin_id: string;
    listing?: {
        name: string;
        type: string;
    };
}

interface User {
    id: string;
    username?: string;
    discord_username?: string;
    subscription_tier: string;
    is_admin?: boolean;
    created_at: string;
    last_seen?: string;
}

interface SystemStats {
    totalListings: number;
    totalUsers: number;
    pendingReviews: number;
    totalVotes: number;
    totalViews: number;
    activeToday: number;
}

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [pendingListings, setPendingListings] = useState<Listing[]>([]);
    const [allListings, setAllListings] = useState<Listing[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [recentActions, setRecentActions] = useState<AdminAction[]>([]);
    const [systemStats, setSystemStats] = useState<SystemStats>({
        totalListings: 0,
        totalUsers: 0,
        pendingReviews: 0,
        totalVotes: 0,
        totalViews: 0,
        activeToday: 0
    });
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            toast({
                variant: "destructive",
                title: "Authentication Required",
                description: "Please sign in to access the admin dashboard",
            });
            navigate('/auth');
            return;
        }
        checkAdminStatus();
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (isAdmin) {
            fetchAllData();
        }
    }, [isAdmin]);

    const checkAdminStatus = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (!data?.is_admin) {
                toast({
                    variant: "destructive",
                    title: "Access Denied",
                    description: "You don't have admin privileges",
                });
                navigate('/');
                return;
            }

            setIsAdmin(true);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to check admin status",
            });
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllData = async () => {
        await Promise.all([
            fetchPendingListings(),
            fetchAllListings(),
            fetchAllUsers(),
            fetchRecentActions(),
            fetchSystemStats()
        ]);
    };

    const fetchPendingListings = async () => {
        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (error) throw error;
            setPendingListings(data || []);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch pending listings",
            });
        }
    };

    const fetchAllListings = async () => {
        try {
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAllListings(data || []);
        } catch (error: any) {
            console.error('Failed to fetch all listings:', error);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setAllUsers(data || []);
        } catch (error: any) {
            console.error('Failed to fetch users:', error);
        }
    };

    const fetchRecentActions = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_actions')
                .select(`
                    *,
                    listing:listings(name, type)
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setRecentActions(data || []);
        } catch (error: any) {
            console.error('Failed to fetch recent actions:', error);
        }
    };

    const fetchSystemStats = async () => {
        try {
            const [listingsData, usersData, votesData] = await Promise.all([
                supabase.from('listings').select('id, status, view_count, created_at'),
                supabase.from('profiles').select('id, created_at'),
                supabase.from('analytics').select('id, event_type').eq('event_type', 'vote')
            ]);

            const listings = listingsData.data || [];
            const users = usersData.data || [];
            const votes = votesData.data || [];

            const today = new Date().toISOString().split('T')[0];
            const activeToday = listings.filter(l => 
                new Date(l.created_at).toISOString().split('T')[0] === today
            ).length;

            setSystemStats({
                totalListings: listings.length,
                totalUsers: users.length,
                pendingReviews: listings.filter(l => l.status === 'pending').length,
                totalVotes: votes.length,
                totalViews: listings.reduce((sum, l) => sum + (l.view_count || 0), 0),
                activeToday
            });
        } catch (error) {
            console.error('Failed to fetch system stats:', error);
        }
    };

    const handleSingleAction = async (listingId: string, action: 'approved' | 'rejected' | 'suspended') => {
        if (!user) return;

        try {
            const newStatus = action === 'approved' ? 'active' : 'suspended';
            const { error: updateError } = await supabase
                .from('listings')
                .update({ status: newStatus })
                .eq('id', listingId);

            if (updateError) throw updateError;

            const { error: actionError } = await supabase
                .from('admin_actions')
                .insert({
                    admin_id: user.id,
                    listing_id: listingId,
                    action,
                    reason: reason || null
                });

            if (actionError) throw actionError;

            toast({
                title: "Success!",
                description: `Listing ${action} successfully`,
            });

            setReason('');
            setSelectedListing(null);
            await fetchAllData();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        }
    };

    const editListing = (listingId: string) => {
        navigate(`/listings/${listingId}`);
    };

    const viewListing = (listingId: string) => {
        navigate(`/listings/${listingId}`);
    };

    const deleteListing = async (listingId: string) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;

        try {
            const { error } = await supabase
                .from('listings')
                .delete()
                .eq('id', listingId);

            if (error) throw error;

            toast({
                title: "Success!",
                description: "Listing deleted successfully",
            });

            await fetchAllData();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
            case 'active':
                return <Badge variant="default" className="bg-green-500/20 text-green-300 border-green-500/30"><Check className="h-3 w-3 mr-1" />Active</Badge>;
            case 'suspended':
                return <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30"><X className="h-3 w-3 mr-1" />Suspended</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-foreground text-xl">Loading admin dashboard...</div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
                    <p className="text-muted-foreground">You don't have admin privileges.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="container mx-auto px-6 py-8 max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent mb-2">
                            Admin Dashboard
                        </h1>
                        <p className="text-muted-foreground text-lg">Manage platform content and users</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => navigate('/analytics')}
                            className="flex items-center gap-2 border-border/50 hover:border-primary/50"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/moderation')}
                            className="flex items-center gap-2 border-border/50 hover:border-primary/50"
                        >
                            <Shield className="h-4 w-4" />
                            Moderation
                        </Button>
                    </div>
                </div>

                {/* System Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    <ModernCard variant="glass" className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Listings</p>
                                <p className="text-2xl font-bold text-foreground">{systemStats.totalListings}</p>
                            </div>
                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Server className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </ModernCard>

                    <ModernCard variant="glass" className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
                                <p className="text-2xl font-bold text-foreground">{systemStats.totalUsers}</p>
                            </div>
                            <div className="h-12 w-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                                <Users className="h-6 w-6 text-secondary" />
                            </div>
                        </div>
                    </ModernCard>

                    <ModernCard variant="glass" className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Pending Reviews</p>
                                <p className="text-2xl font-bold text-foreground">{systemStats.pendingReviews}</p>
                            </div>
                            <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-accent" />
                            </div>
                        </div>
                    </ModernCard>

                    <ModernCard variant="glass" className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Views</p>
                                <p className="text-2xl font-bold text-foreground">{systemStats.totalViews}</p>
                            </div>
                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Eye className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </ModernCard>

                    <ModernCard variant="glass" className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Total Votes</p>
                                <p className="text-2xl font-bold text-foreground">{systemStats.totalVotes}</p>
                            </div>
                            <div className="h-12 w-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-secondary" />
                            </div>
                        </div>
                    </ModernCard>

                    <ModernCard variant="glass" className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">Active Today</p>
                                <p className="text-2xl font-bold text-foreground">{systemStats.activeToday}</p>
                            </div>
                            <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center">
                                <Activity className="h-6 w-6 text-accent" />
                            </div>
                        </div>
                    </ModernCard>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="pending" className="space-y-6">
                    <TabsList className="bg-card/50 border-border/50">
                        <TabsTrigger value="pending" className="text-muted-foreground data-[state=active]:text-foreground">
                            Pending Reviews ({pendingListings.length})
                        </TabsTrigger>
                        <TabsTrigger value="all-listings" className="text-muted-foreground data-[state=active]:text-foreground">
                            All Listings ({allListings.length})
                        </TabsTrigger>
                        <TabsTrigger value="users" className="text-muted-foreground data-[state=active]:text-foreground">
                            Users ({allUsers.length})
                        </TabsTrigger>
                        <TabsTrigger value="events" className="text-muted-foreground data-[state=active]:text-foreground">
                            Events
                        </TabsTrigger>
                        <TabsTrigger value="verification" className="text-muted-foreground data-[state=active]:text-foreground">
                            Verification
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="space-y-6">
                        <ModernCard variant="glass" className="p-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-foreground mb-2">Pending Listings</h2>
                                <p className="text-muted-foreground">Review and moderate pending submissions</p>
                            </div>
                            
                            {pendingListings.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No pending listings to review</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingListings.map((listing) => (
                                        <div key={listing.id} className="flex items-center justify-between p-4 bg-card/30 border border-border/20 rounded-xl">
                                            <div className="flex items-center gap-4">
                                                {listing.avatar_url ? (
                                                    <img src={listing.avatar_url} alt={listing.name} className="w-12 h-12 rounded-xl" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                                        {listing.type === 'server' ? <Server className="h-6 w-6 text-primary" /> : <Bot className="h-6 w-6 text-primary" />}
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="font-semibold text-foreground">{listing.name}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">{listing.description}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {listing.type}
                                                        </Badge>
                                                        {getStatusBadge(listing.status)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => viewListing(listing.id)}
                                                    className="border-border/50 hover:border-primary/50"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => editListing(listing.id)}
                                                    className="border-border/50 hover:border-primary/50"
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => handleSingleAction(listing.id, 'approved')}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleSingleAction(listing.id, 'rejected')}
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ModernCard>
                    </TabsContent>

                    <TabsContent value="all-listings" className="space-y-6">
                        <ModernCard variant="glass" className="p-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-foreground mb-2">All Listings</h2>
                                <p className="text-muted-foreground">Manage all platform listings</p>
                            </div>
                            
                            <div className="space-y-4">
                                {allListings.slice(0, 10).map((listing) => (
                                    <div key={listing.id} className="flex items-center justify-between p-4 bg-card/30 border border-border/20 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            {listing.avatar_url ? (
                                                <img src={listing.avatar_url} alt={listing.name} className="w-12 h-12 rounded-xl" />
                                            ) : (
                                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                                    {listing.type === 'server' ? <Server className="h-6 w-6 text-primary" /> : <Bot className="h-6 w-6 text-primary" />}
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-semibold text-foreground">{listing.name}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{listing.description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {listing.type}
                                                    </Badge>
                                                    {getStatusBadge(listing.status)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => viewListing(listing.id)}
                                                className="border-border/50 hover:border-primary/50"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => editListing(listing.id)}
                                                className="border-border/50 hover:border-primary/50"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => deleteListing(listing.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ModernCard>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-6">
                        <ModernCard variant="glass" className="p-6">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-foreground mb-2">User Management</h2>
                                <p className="text-muted-foreground">Manage platform users and permissions</p>
                            </div>
                            
                            <div className="space-y-4">
                                {allUsers.slice(0, 10).map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-4 bg-card/30 border border-border/20 rounded-xl">
                                        <div>
                                            <h3 className="font-semibold text-foreground">
                                                {user.discord_username || user.username || 'Unknown User'}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {user.subscription_tier}
                                                </Badge>
                                                {user.is_admin && (
                                                    <Badge variant="default" className="text-xs bg-primary/10 text-primary border-primary/20">
                                                        Admin
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-border/50 hover:border-primary/50"
                                            >
                                                <Settings className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ModernCard>
                    </TabsContent>

                    <TabsContent value="events" className="space-y-6">
                        <AdminEventsManagement />
                    </TabsContent>

                    <TabsContent value="verification" className="space-y-6">
                        <VerificationManagement />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default AdminDashboard;