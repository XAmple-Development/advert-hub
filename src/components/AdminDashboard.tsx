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
    AlertTriangle
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
                return <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" />Pending</Badge>;
            case 'active':
                return <Badge variant="default"><Check className="h-3 w-3 mr-1" />Active</Badge>;
            case 'suspended':
                return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Suspended</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'approved':
                return <Badge variant="default"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
            case 'rejected':
                return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
            case 'suspended':
                return <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Suspended</Badge>;
            default:
                return <Badge variant="outline">{action}</Badge>;
        }
    };

    // Show loading state while checking auth and admin status
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#2C2F33]">
                <Navbar />
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <div className="text-white text-xl">Loading admin dashboard...</div>
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
        <div className="min-h-screen bg-[#2C2F33]">
            <Navbar />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                        <p className="text-gray-400">Review and manage Discord server/bot submissions</p>
                    </div>

                    <Tabs defaultValue="pending" className="space-y-6">
                        <TabsList className="bg-[#36393F] border-[#40444B]">
                            <TabsTrigger value="pending" className="data-[state=active]:bg-[#5865F2]">
                                Pending Reviews ({pendingListings.length})
                            </TabsTrigger>
                            <TabsTrigger value="actions" className="data-[state=active]:bg-[#5865F2]">
                                Recent Actions
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending" className="space-y-6">
                            {pendingListings.length === 0 ? (
                                <Card className="bg-[#36393F] border-[#40444B]">
                                    <CardContent className="py-8 text-center">
                                        <div className="text-gray-400 text-lg">No pending submissions to review</div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-6">
                                    {pendingListings.map((listing) => (
                                        <Card key={listing.id} className="bg-[#36393F] border-[#40444B]">
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        {listing.avatar_url ? (
                                                            <img
                                                                src={listing.avatar_url}
                                                                alt={listing.name}
                                                                className="w-12 h-12 rounded-full"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-[#5865F2] rounded-full flex items-center justify-center">
                                                                {listing.type === 'server' ? (
                                                                    <Server className="h-6 w-6 text-white" />
                                                                ) : (
                                                                    <Bot className="h-6 w-6 text-white" />
                                                                )}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <CardTitle className="text-white text-xl">{listing.name}</CardTitle>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant={listing.type === 'server' ? 'default' : 'secondary'}>
                                                                    {listing.type}
                                                                </Badge>
                                                                {getStatusBadge(listing.status)}
                                                                <Badge variant="outline">
                                                                    <Calendar className="h-3 w-3 mr-1" />
                                                                    {new Date(listing.created_at).toLocaleDateString()}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => setSelectedListing(selectedListing?.id === listing.id ? null : listing)}
                                                        variant="outline"
                                                        className="border-[#40444B] text-gray-300 hover:bg-[#40444B]"
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        {selectedListing?.id === listing.id ? 'Hide Details' : 'Review'}
                                                    </Button>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-4">
                                                <p className="text-gray-300">{listing.description}</p>

                                                {listing.tags && listing.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {listing.tags.map((tag, index) => (
                                                            <Badge key={index} variant="outline" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}

                                                {selectedListing?.id === listing.id && (
                                                    <div className="pt-4 border-t border-[#40444B] space-y-4">
                                                        {listing.long_description && (
                                                            <div>
                                                                <h4 className="text-white font-medium mb-2">Full Description:</h4>
                                                                <p className="text-gray-300 text-sm leading-relaxed">
                                                                    {listing.long_description}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-2">
                                                            {listing.invite_url && (
                                                                <Button
                                                                    onClick={() => window.open(listing.invite_url, '_blank')}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border-[#40444B] text-gray-300 hover:bg-[#40444B]"
                                                                >
                                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                                    Visit
                                                                </Button>
                                                            )}
                                                            {listing.website_url && (
                                                                <Button
                                                                    onClick={() => window.open(listing.website_url, '_blank')}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="border-[#40444B] text-gray-300 hover:bg-[#40444B]"
                                                                >
                                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                                    Website
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Textarea
                                                                placeholder="Add a reason for your decision (optional)"
                                                                value={reason}
                                                                onChange={(e) => setReason(e.target.value)}
                                                                className="bg-[#2C2F33] border-[#40444B] text-white"
                                                            />

                                                            <div className="flex gap-3">
                                                                <Button
                                                                    onClick={() => handleAction(listing.id, 'approved')}
                                                                    className="bg-[#57F287] hover:bg-[#3BA55C] text-black"
                                                                >
                                                                    <Check className="h-4 w-4 mr-2" />
                                                                    Approve
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleAction(listing.id, 'rejected')}
                                                                    variant="destructive"
                                                                >
                                                                    <X className="h-4 w-4 mr-2" />
                                                                    Reject
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleAction(listing.id, 'suspended')}
                                                                    variant="outline"
                                                                    className="border-[#FAA61A] text-[#FAA61A] hover:bg-[#FAA61A] hover:text-black"
                                                                >
                                                                    <Shield className="h-4 w-4 mr-2" />
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
                            <Card className="bg-[#36393F] border-[#40444B]">
                                <CardHeader>
                                    <CardTitle className="text-white">Recent Admin Actions</CardTitle>
                                    <CardDescription className="text-gray-400">
                                        Latest moderation decisions made by staff
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {recentActions.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            No recent actions to display
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-[#40444B]">
                                                    <TableHead className="text-gray-300">Date</TableHead>
                                                    <TableHead className="text-gray-300">Listing</TableHead>
                                                    <TableHead className="text-gray-300">Action</TableHead>
                                                    <TableHead className="text-gray-300">Reason</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {recentActions.map((action) => (
                                                    <TableRow key={action.id} className="border-[#40444B]">
                                                        <TableCell className="text-gray-300">
                                                            {new Date(action.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-white">
                                                            {action.listing?.name || 'Unknown'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getActionBadge(action.action)}
                                                        </TableCell>
                                                        <TableCell className="text-gray-300">
                                                            {action.reason || 'No reason provided'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
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
