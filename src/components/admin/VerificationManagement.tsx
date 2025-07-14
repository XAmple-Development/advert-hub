import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldCheck, Crown, Sparkles, Server, Bot, Calendar, RefreshCw } from 'lucide-react';
import ListingVerificationBadge from '@/components/verification/ListingVerificationBadge';

interface ListingWithVerification {
  id: string;
  name: string;
  type: 'server' | 'bot';
  avatar_url?: string;
  created_at: string;
  status: string;
  verification?: {
    id: string;
    verification_status: string;
    verification_level?: string;
    verified_at?: string;
    verified_by?: string;
  };
}

const VerificationManagement = () => {
  const [listings, setListings] = useState<ListingWithVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          name,
          type,
          avatar_url,
          created_at,
          status,
          server_verification:server_verification(
            id,
            verification_status,
            verification_level,
            verified_at,
            verified_by
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedData = data?.map(listing => ({
        ...listing,
        verification: listing.server_verification?.[0] || null
      })) || [];

      setListings(formattedData);
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch listings",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVerificationStatus = async (
    listingId: string,
    status: 'pending' | 'verified' | 'rejected',
    level?: 'basic' | 'premium' | 'partner'
  ) => {
    setUpdating(listingId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if verification record exists
      const { data: existing, error: fetchError } = await supabase
        .from('server_verification')
        .select('id')
        .eq('listing_id', listingId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const verificationData = {
        listing_id: listingId,
        verification_status: status,
        verification_level: level || 'basic',
        verified_at: status === 'verified' ? new Date().toISOString() : null,
        verified_by: status === 'verified' ? user.id : null,
      };

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('server_verification')
          .update(verificationData)
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('server_verification')
          .insert(verificationData);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success!",
        description: `Verification ${status} successfully`,
      });

      // Refresh listings
      fetchListings();
    } catch (error: any) {
      console.error('Error updating verification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setUpdating(null);
    }
  };

  const removeVerification = async (listingId: string) => {
    setUpdating(listingId);
    try {
      const { error } = await supabase
        .from('server_verification')
        .delete()
        .eq('listing_id', listingId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Verification removed successfully",
      });

      fetchListings();
    } catch (error: any) {
      console.error('Error removing verification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
        <CardContent className="py-16 text-center">
          <RefreshCw className="h-8 w-8 text-purple-400 mx-auto mb-4 animate-spin" />
          <div className="text-xl text-white">Loading verification data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
      <CardHeader className="p-8 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-2xl font-bold">Verification Management</CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Manage server and bot verification status and levels
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={fetchListings}
            variant="outline"
            className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="overflow-hidden rounded-2xl border border-gray-700/50">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700/50 bg-gradient-to-r from-gray-800/30 to-gray-900/30">
                <TableHead className="text-gray-200 font-bold text-base">Listing</TableHead>
                <TableHead className="text-gray-200 font-bold text-base">Type</TableHead>
                <TableHead className="text-gray-200 font-bold text-base">Current Status</TableHead>
                <TableHead className="text-gray-200 font-bold text-base">Verification Level</TableHead>
                <TableHead className="text-gray-200 font-bold text-base">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id} className="border-gray-700/50 hover:bg-gradient-to-r hover:from-gray-800/20 hover:to-gray-900/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {listing.avatar_url ? (
                        <img
                          src={listing.avatar_url}
                          alt={listing.name}
                          className="w-10 h-10 rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                          {listing.type === 'server' ? (
                            <Server className="h-5 w-5 text-white" />
                          ) : (
                            <Bot className="h-5 w-5 text-white" />
                          )}
                        </div>
                      )}
                      <div>
                        <div className="text-white font-medium">{listing.name}</div>
                        <div className="text-gray-400 text-sm flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(listing.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant={listing.type === 'server' ? 'default' : 'secondary'} className="bg-purple-500/20 border-purple-500/30 text-purple-300">
                      {listing.type}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <ListingVerificationBadge listingId={listing.id} size="sm" />
                  </TableCell>
                  
                  <TableCell>
                    {listing.verification && (
                      <Select
                        value={listing.verification.verification_level || 'basic'}
                        onValueChange={(value) => 
                          updateVerificationStatus(
                            listing.id, 
                            listing.verification?.verification_status as any, 
                            value as any
                          )
                        }
                        disabled={updating === listing.id}
                      >
                        <SelectTrigger className="w-32 bg-gray-800/50 border-gray-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-green-400" />
                              Basic
                            </div>
                          </SelectItem>
                          <SelectItem value="premium">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-blue-400" />
                              Premium
                            </div>
                          </SelectItem>
                          <SelectItem value="partner">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4 text-purple-400" />
                              Partner
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex gap-2">
                      {listing.verification ? (
                        <>
                          <Select
                            value={listing.verification.verification_status}
                            onValueChange={(value) => 
                              updateVerificationStatus(
                                listing.id,
                                value as any,
                                listing.verification?.verification_level as any
                              )
                            }
                            disabled={updating === listing.id}
                          >
                            <SelectTrigger className="w-28 bg-gray-800/50 border-gray-600 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="verified">Verified</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={() => removeVerification(listing.id)}
                            variant="outline"
                            size="sm"
                            className="bg-red-900/20 border-red-500/30 text-red-300 hover:bg-red-900/40"
                            disabled={updating === listing.id}
                          >
                            Remove
                          </Button>
                        </>
                      ) : (
                        <Select
                          onValueChange={(value) => {
                            const [status, level] = value.split(':');
                            updateVerificationStatus(listing.id, status as any, level as any);
                          }}
                          disabled={updating === listing.id}
                        >
                          <SelectTrigger className="w-40 bg-gray-800/50 border-gray-600">
                            <SelectValue placeholder="Add verification" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="verified:basic">Verify as Basic</SelectItem>
                            <SelectItem value="verified:premium">Verify as Premium</SelectItem>
                            <SelectItem value="verified:partner">Verify as Partner</SelectItem>
                            <SelectItem value="pending:basic">Set as Pending</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default VerificationManagement;