import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
    Sparkles
} from 'lucide-react';
import Navbar from '@/components/Navbar';

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

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [pendingListings, setPendingListings] = useState<Listing[]>([]);
    const [recentActions, setRecentActions] = useState<AdminAction[]>([]);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        // Wait for auth to finish loading
        if (authLoading) return;

        // If no user is authenticated, redirect to auth page
        if (!user) {
            toast({
                variant: "destructive",
                title: "Authentication Required",
                description: "Please sign in to access the admin dashboard",
            });
            navigate('/auth');
            return;
        }

        // Check admin status
        checkAdminStatus();
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (isAdmin) {
            fetchPendingListings();
            fetchRecentActions();
        }
    }, [isAdmin]);

    const checkAdminStatus = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            console.log('Checking admin status for user:', user.id);
            const { data, error } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error checking admin status:', error);
                throw error;
            }

            console.log('Admin check result:', data);

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
            console.error('Admin status check failed:', error);
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

    const fetchPendingListings = async () => {
        try {
            console.log('Fetching pending listings...');
            const { data, error } = await supabase
                .from('listings')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching pending listings:', error);
                throw error;
            }

            console.log('Pending listings fetched:', data?.length || 0);
            setPendingListings(data || []);
        } catch (error: any) {
            console.error('Failed to fetch pending listings:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch pending listings",
            });
        }
    };

    const fetchRecentActions = async () => {
        try {
            console.log('Fetching recent actions...');
            const { data, error } = await supabase
                .from('admin_actions')
                .select(`
                    *,
                    listing:listings(name, type)
                `)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error fetching recent actions:', error);
                throw error;
            }

            console.log('Recent actions fetched:', data?.length || 0);
            setRecentActions(data || []);
        } catch (error: any) {
            console.error('Failed to fetch recent actions:', error);
        }
    };

    const handleAction = async (listingId: string, action: 'approved' | 'rejected' | 'suspended') => {
        if (!user) return;

        try {
            console.log(`Performing action ${action} on listing ${listingId}`);
            
            // Update listing status
            const newStatus = action === 'approved' ? 'active' : 'suspended';
            const { error: updateError } = await supabase
                .from('listings')
                .update({ status: newStatus })
                .eq('id', listingId);

            if (updateError) {
                console.error('Error updating listing:', updateError);
                throw updateError;
            }

            // Record admin action
            const { error: actionError } = await supabase
                .from('admin_actions')
                .insert({
                    admin_id: user.id,
                    listing_id: listingId,
                    action,
                    reason: reason || null
                });

            if (actionError) {
                console.error('Error recording admin action:', actionError);
                throw actionError;
            }

            toast({
                title: "Success!",
                description: `Listing ${action} successfully`,
            });

            setReason('');
            setSelectedListing(null);
            fetchPendingListings();
            fetchRecentActions();
        } catch (error: any) {
            console.error('Action failed:', error);
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

    // Show loading state while checking auth and admin status
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)] relative">
                    {/* Background Elements */}
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

    // If user is not authenticated, this will be handled by the useEffect redirect
    if (!user) {
        return null;
    }

    // If user is not admin, this will be handled by the useEffect redirect
    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 overflow-hidden">
            <Navbar />
            
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-full mb-8 backdrop-blur-sm">
                            <Shield className="h-4 w-4 text-red-300" />
                            <span className="text-red-200 font-medium">Admin Access</span>
                        </div>
                        
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
                            Admin
                            <span className="block bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                                Dashboard
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 max-w-4xl leading-relaxed">
                            Review and manage Discord server & bot submissions with advanced moderation tools.
                        </p>
                    </div>

                    <Tabs defaultValue="pending" className="space-y-8">
                        <TabsList className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2">
                            <TabsTrigger 
                                value="pending" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium"
                            >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Pending Reviews ({pendingListings.length})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="actions" 
                                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium"
                            >
                                <Shield className="h-4 w-4 mr-2" />
                                Recent Actions
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending" className="space-y-8">
                            {pendingListings.length === 0 ? (
                                <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
                                    <CardContent className="py-16 text-center">
                                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full mb-6">
                                            <Check className="h-10 w-10 text-green-400" />
                                        </div>
                                        <div className="text-2xl font-bold text-white mb-2">All caught up!</div>
                                        <div className="text-gray-300 text-lg">No pending submissions to review</div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-8">
                                    {pendingListings.map((listing) => (
                                        <Card key={listing.id} className="group bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 rounded-3xl overflow-hidden">
                                            <CardHeader className="p-8">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center space-x-6">
                                                        {listing.avatar_url ? (
                                                            <img
                                                                src={listing.avatar_url}
                                                                alt={listing.name}
                                                                className="w-16 h-16 rounded-2xl"
                                                            />
                                                        ) : (
                                                            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                                                                {listing.type === 'server' ? (
                                                                    <Server className="h-8 w-8 text-white" />
                                                                ) : (
                                                                    <Bot className="h-8 w-8 text-white" />
                                                                )}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <CardTitle className="text-white text-2xl font-bold mb-2">{listing.name}</CardTitle>
                                                            <div className="flex items-center gap-3">
                                                                <Badge variant={listing.type === 'server' ? 'default' : 'secondary'} className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300">
                                                                    {listing.type}
                                                                </Badge>
                                                                {getStatusBadge(listing.status)}
                                                                <Badge variant="outline" className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-gray-600/50 text-gray-300">
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    {new Date(listing.created_at).toLocaleDateString()}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => setSelectedListing(selectedListing?.id === listing.id ? null : listing)}
                                                        size="lg"
                                                        className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-cyan-500/50 text-gray-300 hover:text-white transition-all duration-300 rounded-2xl px-6 py-3"
                                                    >
                                                        <Eye className="h-5 w-5 mr-2" />
                                                        {selectedListing?.id === listing.id ? 'Hide Details' : 'Review'}
                                                    </Button>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="px-8 pb-8 space-y-6">
                                                <p className="text-gray-300 text-lg leading-relaxed">{listing.description}</p>

                                                {listing.tags && listing.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-3">
                                                        {listing.tags.map((tag, index) => (
                                                            <Badge key={index} variant="outline" className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-gray-600/50 text-gray-300 text-sm">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                {selectedListing?.id === listing.id && (
                                                    <div className="pt-6 border-t border-gray-700/50 space-y-6">
                                                        {listing.long_description && (
                                                            <div className="bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30">
                                                                <h4 className="text-white font-bold text-lg mb-3">Full Description:</h4>
                                                                <p className="text-gray-300 text-base leading-relaxed">
                                                                    {listing.long_description}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-4">
                                                            {listing.invite_url && (
                                                                <Button
                                                                    onClick={() => window.open(listing.invite_url, '_blank')}
                                                                    size="sm"
                                                                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl"
                                                                >
                                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                                    Visit Server
                                                                </Button>
                                                            )}
                                                            {listing.website_url && (
                                                                <Button
                                                                    onClick={() => window.open(listing.website_url, '_blank')}
                                                                    size="sm"
                                                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl"
                                                                >
                                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                                    Website
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <div className="space-y-4">
                                                            <Textarea
                                                                placeholder="Add a reason for your decision (optional)"
                                                                value={reason}
                                                                onChange={(e) => setReason(e.target.value)}
                                                                className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 text-white placeholder-gray-400 rounded-2xl min-h-[100px] resize-none"
                                                            />

                                                            <div className="flex gap-4">
                                                                <Button
                                                                    onClick={() => handleAction(listing.id, 'approved')}
                                                                    size="lg"
                                                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl px-8 py-3"
                                                                >
                                                                    <Check className="h-5 w-5 mr-2" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleAction(listing.id, 'rejected')}
                                                                    size="lg"
                                                                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl px-8 py-3"
                                                                >
                                                                    <X className="h-5 w-5 mr-2" />
                                                                    Reject
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleAction(listing.id, 'suspended')}
                                                                    size="lg"
                                                                    className="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-2xl px-8 py-3"
                                                                >
                                                                    <Shield className="h-5 w-5 mr-2" />
                                                                    Suspend
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="actions">
                            <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
                                <CardHeader className="p-8 border-b border-gray-700/50">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl">
                                            <Shield className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-white text-2xl font-bold">Recent Admin Actions</CardTitle>
                                            <CardDescription className="text-gray-300 text-lg">
                                                Latest moderation decisions made by staff
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    {recentActions.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-gray-300 text-xl">No recent actions to display</div>
                                        </div>
                                    ) : (
                                        <div className="overflow-hidden rounded-2xl border border-gray-700/50">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-gray-700/50 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
                                                        <TableHead className="text-gray-200 font-bold text-base">Date</TableHead>
                                                        <TableHead className="text-gray-200 font-bold text-base">Listing</TableHead>
                                                        <TableHead className="text-gray-200 font-bold text-base">Action</TableHead>
                                                        <TableHead className="text-gray-200 font-bold text-base">Reason</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {recentActions.map((action) => (
                                                        <TableRow key={action.id} className="border-gray-700/50 hover:bg-gradient-to-r hover:from-gray-800/20 hover:to-gray-900/20 transition-colors">
                                                            <TableCell className="text-gray-300 text-base">
                                                                {new Date(action.created_at).toLocaleDateString()}
                                                            </TableCell>
                                                            <TableCell className="text-white font-medium text-base">
                                                                {action.listing?.name || 'Unknown'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {getActionBadge(action.action)}
                                                            </TableCell>
                                                            <TableCell className="text-gray-300 text-base max-w-md">
                                                                {action.reason || 'No reason provided'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
