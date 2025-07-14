import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

interface BulkAction {
    action: 'approve' | 'reject' | 'suspend' | 'feature' | 'unfeature' | 'verify' | 'unverify';
    reason?: string;
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
    const [selectedListings, setSelectedListings] = useState<string[]>([]);
    const [bulkAction, setBulkAction] = useState<BulkAction>({ action: 'approve' });
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
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

    const handleBulkAction = async () => {
        if (!user || selectedListings.length === 0) return;

        try {
            const updates = selectedListings.map(async (listingId) => {
                let updateData: any = {};
                
                switch (bulkAction.action) {
                    case 'approve':
                        updateData.status = 'active';
                        break;
                    case 'reject':
                    case 'suspend':
                        updateData.status = 'suspended';
                        break;
                    case 'feature':
                        updateData.featured = true;
                        break;
                    case 'unfeature':
                        updateData.featured = false;
                        break;
                    case 'verify':
                        updateData.verified_badge = true;
                        break;
                    case 'unverify':
                        updateData.verified_badge = false;
                        break;
                }

                const { error: updateError } = await supabase
                    .from('listings')
                    .update(updateData)
                    .eq('id', listingId);

                if (updateError) throw updateError;

                return supabase
                    .from('admin_actions')
                    .insert({
                        admin_id: user.id,
                        listing_id: listingId,
                        action: bulkAction.action,
                        reason: bulkAction.reason || null
                    });
            });

            await Promise.all(updates);

            toast({
                title: "Success!",
                description: `Bulk action completed on ${selectedListings.length} listings`,
            });

            setSelectedListings([]);
            setShowBulkActions(false);
            setBulkAction({ action: 'approve' });
            await fetchAllData();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        }
    };

    const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'promote' | 'demote') => {
        try {
            let updateData: any = {};
            
            switch (action) {
                case 'ban':
                    updateData.subscription_tier = 'banned';
                    break;
                case 'unban':
                    updateData.subscription_tier = 'free';
                    break;
                case 'promote':
                    updateData.is_admin = true;
                    break;
                case 'demote':
                    updateData.is_admin = false;
                    break;
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', userId);

            if (error) throw error;

            toast({
                title: "Success!",
                description: `User ${action} action completed`,
            });

            await fetchAllUsers();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        }
    };

    const sendGlobalAnnouncement = async () => {
        if (!announcement.trim()) return;

        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: null, // Global announcement
                    type: 'announcement',
                    title: 'System Announcement',
                    message: announcement,
                    priority: announcementType === 'error' ? 'high' : 'normal'
                });

            if (error) throw error;

            toast({
                title: "Success!",
                description: "Global announcement sent to all users",
            });

            setAnnouncement('');
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

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'approved':
                return <Badge variant="default" className="bg-green-500/20 text-green-300 border-green-500/30"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive" className="bg-red-500/20 text-red-300 border-red-500/30"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
            case 'suspended':
                return <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30"><Shield className="h-3 w-3 mr-1" />Suspended</Badge>;
            default:
                return <Badge variant="outline">{action}</Badge>;
        }
    };

    const filteredListings = allListings.filter(listing => {
        const matchesSearch = listing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            listing.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
        const matchesType = typeFilter === 'all' || listing.type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
    });

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
                <div className="flex items-center justify-center min-h-screen relative">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
                    </div>
                    <div className="relative z-10 text-center">
                        <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            Loading Admin Dashboard...
                        </div>
                        <div className="text-gray-300">Verifying permissions...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 overflow-hidden">            
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 py-8">
                <div className="max-w-7xl mx-auto px-6">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-full mb-6 backdrop-blur-sm">
                            <Shield className="h-4 w-4 text-red-300" />
                            <span className="text-red-200 font-medium">Admin Access</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                            Admin
                            <span className="block bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                                Dashboard
                            </span>
                        </h1>
                        <p className="text-lg text-gray-300 max-w-3xl">
                            Comprehensive platform management with advanced controls, analytics, and moderation tools.
                        </p>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
                        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-200 text-sm font-medium">Total Listings</p>
                                        <p className="text-2xl font-bold text-white">{systemStats.totalListings}</p>
                                    </div>
                                    <Server className="h-8 w-8 text-blue-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-200 text-sm font-medium">Total Users</p>
                                        <p className="text-2xl font-bold text-white">{systemStats.totalUsers}</p>
                                    </div>
                                    <Users className="h-8 w-8 text-green-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-yellow-200 text-sm font-medium">Pending Reviews</p>
                                        <p className="text-2xl font-bold text-white">{systemStats.pendingReviews}</p>
                                    </div>
                                    <AlertTriangle className="h-8 w-8 text-yellow-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-200 text-sm font-medium">Total Votes</p>
                                        <p className="text-2xl font-bold text-white">{systemStats.totalVotes}</p>
                                    </div>
                                    <Star className="h-8 w-8 text-purple-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-cyan-200 text-sm font-medium">Total Views</p>
                                        <p className="text-2xl font-bold text-white">{systemStats.totalViews}</p>
                                    </div>
                                    <Eye className="h-8 w-8 text-cyan-400" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-red-200 text-sm font-medium">Active Today</p>
                                        <p className="text-2xl font-bold text-white">{systemStats.activeToday}</p>
                                    </div>
                                    <Activity className="h-8 w-8 text-red-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="pending" className="space-y-6">
                        <TabsList className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2">
                            <TabsTrigger value="pending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl px-4 py-2 font-medium">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Pending ({pendingListings.length})
                            </TabsTrigger>
                            <TabsTrigger value="listings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl px-4 py-2 font-medium">
                                <Server className="h-4 w-4 mr-2" />
                                All Listings
                            </TabsTrigger>
                            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl px-4 py-2 font-medium">
                                <Users className="h-4 w-4 mr-2" />
                                User Management
                            </TabsTrigger>
                            <TabsTrigger value="verification" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl px-4 py-2 font-medium">
                                <Shield className="h-4 w-4 mr-2" />
                                Verification
                            </TabsTrigger>
                            <TabsTrigger value="actions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl px-4 py-2 font-medium">
                                <Eye className="h-4 w-4 mr-2" />
                                Actions Log
                            </TabsTrigger>
                            <TabsTrigger value="events" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl px-4 py-2 font-medium">
                                <Calendar className="h-4 w-4 mr-2" />
                                Events
                            </TabsTrigger>
                            <TabsTrigger value="system" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl px-4 py-2 font-medium">
                                <Settings className="h-4 w-4 mr-2" />
                                System
                            </TabsTrigger>
                        </TabsList>

                        {/* Pending Reviews Tab */}
                        <TabsContent value="pending" className="space-y-6">
                            {pendingListings.length === 0 ? (
                                <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-3xl">
                                    <CardContent className="py-16 text-center">
                                        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                                        <div className="text-2xl font-bold text-white mb-2">All caught up!</div>
                                        <div className="text-gray-300">No pending submissions to review</div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-6">
                                    {pendingListings.map((listing) => (
                                        <Card key={listing.id} className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 rounded-2xl">
                                            <CardHeader className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        {listing.avatar_url ? (
                                                            <img src={listing.avatar_url} alt={listing.name} className="w-12 h-12 rounded-xl" />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                                                                {listing.type === 'server' ? <Server className="h-6 w-6 text-white" /> : <Bot className="h-6 w-6 text-white" />}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <CardTitle className="text-white text-xl font-bold">{listing.name}</CardTitle>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {listing.type === 'server' ? 'Server' : 'Bot'}
                                                                </Badge>
                                                                {getStatusBadge(listing.status)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button onClick={() => handleSingleAction(listing.id, 'approved')} className="bg-green-600 hover:bg-green-700">
                                                            <Check className="h-4 w-4 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button onClick={() => handleSingleAction(listing.id, 'rejected')} variant="destructive">
                                                            <X className="h-4 w-4 mr-1" />
                                                            Reject
                                                        </Button>
                                                    </div>
                                                </div>
                                                <CardDescription className="text-gray-300 mt-4">
                                                    {listing.description}
                                                </CardDescription>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* All Listings Tab */}
                        <TabsContent value="listings" className="space-y-6">
                            <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
                                <CardHeader className="p-6">
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Database className="h-5 w-5" />
                                        Listings Management
                                    </CardTitle>
                                    <div className="flex flex-wrap gap-4 mt-4">
                                        <div className="flex-1 min-w-[200px]">
                                            <Input
                                                placeholder="Search listings..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="bg-gray-700/50 border-gray-600"
                                            />
                                        </div>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="w-[140px] bg-gray-700/50 border-gray-600">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Status</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="suspended">Suspended</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                                            <SelectTrigger className="w-[120px] bg-gray-700/50 border-gray-600">
                                                <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="server">Servers</SelectItem>
                                                <SelectItem value="bot">Bots</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={() => setShowBulkActions(!showBulkActions)} variant="outline">
                                            <Settings className="h-4 w-4 mr-2" />
                                            Bulk Actions
                                        </Button>
                                    </div>
                                    
                                    {showBulkActions && (
                                        <div className="mt-4 p-4 bg-gray-700/30 rounded-xl border border-gray-600/50">
                                            <div className="flex items-center gap-4">
                                                <Select value={bulkAction.action} onValueChange={(value: any) => setBulkAction({...bulkAction, action: value})}>
                                                    <SelectTrigger className="w-[150px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="approve">Approve</SelectItem>
                                                        <SelectItem value="reject">Reject</SelectItem>
                                                        <SelectItem value="suspend">Suspend</SelectItem>
                                                        <SelectItem value="feature">Feature</SelectItem>
                                                        <SelectItem value="unfeature">Unfeature</SelectItem>
                                                        <SelectItem value="verify">Verify</SelectItem>
                                                        <SelectItem value="unverify">Unverify</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    placeholder="Reason (optional)"
                                                    value={bulkAction.reason || ''}
                                                    onChange={(e) => setBulkAction({...bulkAction, reason: e.target.value})}
                                                    className="flex-1"
                                                />
                                                <Button onClick={handleBulkAction} disabled={selectedListings.length === 0}>
                                                    Apply to {selectedListings.length} listings
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <ScrollArea className="h-[600px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    {showBulkActions && <TableHead className="w-12">Select</TableHead>}
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Stats</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredListings.map((listing) => (
                                                    <TableRow key={listing.id}>
                                                        {showBulkActions && (
                                                            <TableCell>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedListings.includes(listing.id)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedListings([...selectedListings, listing.id]);
                                                                        } else {
                                                                            setSelectedListings(selectedListings.filter(id => id !== listing.id));
                                                                        }
                                                                    }}
                                                                    className="rounded"
                                                                />
                                                            </TableCell>
                                                        )}
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                {listing.avatar_url ? (
                                                                    <img src={listing.avatar_url} alt={listing.name} className="w-8 h-8 rounded-lg" />
                                                                ) : (
                                                                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                                                        {listing.type === 'server' ? <Server className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <div className="font-medium text-white">{listing.name}</div>
                                                                    <div className="text-xs text-gray-400 truncate max-w-[200px]">{listing.description}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{listing.type}</Badge>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(listing.status)}</TableCell>
                                                        <TableCell>
                                                            <div className="text-xs text-gray-400">
                                                                <div>Views: {listing.view_count || 0}</div>
                                                                <div>Votes: {listing.vote_count || 0}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1">
                                                                <Button size="sm" variant="outline" onClick={() => window.open(`/listing/${listing.id}`, '_blank')}>
                                                                    <ExternalLink className="h-3 w-3" />
                                                                </Button>
                                                                <Button size="sm" variant="outline">
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                                <Button size="sm" variant="destructive">
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* User Management Tab */}
                        <TabsContent value="users" className="space-y-6">
                            <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
                                <CardHeader className="p-6">
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        User Management
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <ScrollArea className="h-[600px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>User</TableHead>
                                                    <TableHead>Subscription</TableHead>
                                                    <TableHead>Admin</TableHead>
                                                    <TableHead>Joined</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {allUsers.map((user) => (
                                                    <TableRow key={user.id}>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-medium text-white">{user.username || user.discord_username || 'Unknown'}</div>
                                                                <div className="text-xs text-gray-400">{user.id.slice(0, 8)}...</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={user.subscription_tier === 'premium' ? 'default' : 'outline'}>
                                                                {user.subscription_tier}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {user.is_admin ? (
                                                                <Badge variant="default" className="bg-red-500/20 text-red-300">
                                                                    <Crown className="h-3 w-3 mr-1" />
                                                                    Admin
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline">User</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-sm text-gray-400">
                                                                {new Date(user.created_at).toLocaleDateString()}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1">
                                                                {user.subscription_tier !== 'banned' ? (
                                                                    <Button size="sm" variant="destructive" onClick={() => handleUserAction(user.id, 'ban')}>
                                                                        <Ban className="h-3 w-3 mr-1" />
                                                                        Ban
                                                                    </Button>
                                                                ) : (
                                                                    <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, 'unban')}>
                                                                        <UserCheck className="h-3 w-3 mr-1" />
                                                                        Unban
                                                                    </Button>
                                                                )}
                                                                {!user.is_admin ? (
                                                                    <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, 'promote')}>
                                                                        <ArrowUp className="h-3 w-3 mr-1" />
                                                                        Promote
                                                                    </Button>
                                                                ) : (
                                                                    <Button size="sm" variant="outline" onClick={() => handleUserAction(user.id, 'demote')}>
                                                                        <ArrowDown className="h-3 w-3 mr-1" />
                                                                        Demote
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Verification Management Tab */}
                        <TabsContent value="verification" className="space-y-6">
                            <VerificationManagement />
                        </TabsContent>

                        {/* Actions Log Tab */}
                        <TabsContent value="actions" className="space-y-6">
                            <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
                                <CardHeader className="p-6">
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        Recent Admin Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-6 pt-0">
                                    <ScrollArea className="h-[500px]">
                                        <div className="space-y-4">
                                            {recentActions.map((action) => (
                                                <div key={action.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                                        <div>
                                                            <div className="text-white font-medium">
                                                                {getActionBadge(action.action)} {action.listing?.name}
                                                            </div>
                                                            <div className="text-sm text-gray-400">
                                                                {action.reason && `Reason: ${action.reason}`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {new Date(action.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Events Management Tab */}
                        <TabsContent value="events" className="space-y-6">
                            <AdminEventsManagement />
                        </TabsContent>

                        {/* System Management Tab */}
                        <TabsContent value="system" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Global Announcements */}
                                <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
                                    <CardHeader className="p-6">
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <Megaphone className="h-5 w-5" />
                                            Global Announcements
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0 space-y-4">
                                        <Select value={announcementType} onValueChange={(value: any) => setAnnouncementType(value)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="info">Info</SelectItem>
                                                <SelectItem value="warning">Warning</SelectItem>
                                                <SelectItem value="success">Success</SelectItem>
                                                <SelectItem value="error">Error</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Textarea
                                            placeholder="Enter announcement message..."
                                            value={announcement}
                                            onChange={(e) => setAnnouncement(e.target.value)}
                                            rows={4}
                                        />
                                        <Button onClick={sendGlobalAnnouncement} disabled={!announcement.trim()}>
                                            <Bell className="h-4 w-4 mr-2" />
                                            Send to All Users
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* System Actions */}
                                <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
                                    <CardHeader className="p-6">
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <Terminal className="h-5 w-5" />
                                            System Actions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 pt-0 space-y-3">
                                        <Button variant="outline" className="w-full justify-start">
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Refresh Cache
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start">
                                            <Download className="h-4 w-4 mr-2" />
                                            Export Data
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start">
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                            Generate Reports
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start">
                                            <Webhook className="h-4 w-4 mr-2" />
                                            Test Webhooks
                                        </Button>
                                        <Button variant="destructive" className="w-full justify-start">
                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                            Emergency Maintenance
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
