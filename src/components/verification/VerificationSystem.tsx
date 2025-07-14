import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldCheck, Clock, X, CheckCircle, AlertCircle } from 'lucide-react';
import VerificationBadge from './VerificationBadge';

interface VerificationRequest {
  id: string;
  listing_id: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_level: 'basic' | 'premium' | 'partner';
  verification_criteria: any;
  rejection_reason?: string;
  created_at: string;
  listings: {
    name: string;
    description: string;
    member_count: number;
    type: string;
  };
}

interface VerificationSystemProps {
  listingId?: string;
  adminView?: boolean;
}

const VerificationSystem = ({ listingId, adminView = false }: VerificationSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Application form state
  const [applicationData, setApplicationData] = useState({
    requested_level: 'basic',
    description: '',
    community_guidelines: '',
    moderation_info: '',
    additional_info: ''
  });

  useEffect(() => {
    fetchVerificationData();
  }, [listingId, adminView]);

  const fetchVerificationData = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('server_verification')
        .select(`
          *,
          listings(name, description, member_count, type)
        `);

      if (listingId && !adminView) {
        query = query.eq('listing_id', listingId);
      }

      if (adminView) {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests((data || []) as VerificationRequest[]);
    } catch (error) {
      console.error('Error fetching verification data:', error);
      toast({
        title: "Error",
        description: "Failed to load verification data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitVerificationRequest = async () => {
    if (!listingId || !user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('server_verification')
        .insert({
          listing_id: listingId,
          verification_level: applicationData.requested_level,
          verification_criteria: {
            description: applicationData.description,
            community_guidelines: applicationData.community_guidelines,
            moderation_info: applicationData.moderation_info,
            additional_info: applicationData.additional_info
          }
        });

      if (error) throw error;

      toast({
        title: "Application Submitted",
        description: "Your verification request has been submitted for review."
      });

      fetchVerificationData();
      setApplicationData({
        requested_level: 'basic',
        description: '',
        community_guidelines: '',
        moderation_info: '',
        additional_info: ''
      });
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Error",
        description: "Failed to submit verification request",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateVerificationStatus = async (
    verificationId: string, 
    status: 'verified' | 'rejected', 
    rejectionReason?: string
  ) => {
    try {
      const updateData: any = {
        verification_status: status,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
        verified_by: status === 'verified' ? user?.id : null,
        rejection_reason: rejectionReason || null
      };

      const { error } = await supabase
        .from('server_verification')
        .update(updateData)
        .eq('id', verificationId);

      if (error) throw error;

      toast({
        title: status === 'verified' ? "Server Verified" : "Verification Rejected",
        description: status === 'verified' 
          ? "The server has been successfully verified."
          : "The verification request has been rejected."
      });

      fetchVerificationData();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 animate-pulse" />
            Loading Verification Data...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // Individual listing view
  if (listingId && !adminView) {
    const existingRequest = requests[0];

    if (existingRequest) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verification Status
              <VerificationBadge 
                status={existingRequest.verification_status}
                level={existingRequest.verification_level}
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingRequest.verification_status === 'pending' && (
              <div className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-4 w-4" />
                <span>Your verification request is being reviewed.</span>
              </div>
            )}
            
            {existingRequest.verification_status === 'rejected' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600">
                  <X className="h-4 w-4" />
                  <span>Verification request was rejected.</span>
                </div>
                {existingRequest.rejection_reason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">
                      <strong>Reason:</strong> {existingRequest.rejection_reason}
                    </p>
                  </div>
                )}
                <Button onClick={() => fetchVerificationData()} variant="outline">
                  Apply Again
                </Button>
              </div>
            )}

            {existingRequest.verification_status === 'verified' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Your server is verified!</span>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    // Application form
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Apply for Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Verification Level</label>
            <Select
              value={applicationData.requested_level}
              onValueChange={(value) => setApplicationData(prev => ({ ...prev, requested_level: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Verification</SelectItem>
                <SelectItem value="premium">Premium Verification</SelectItem>
                <SelectItem value="partner">Partner Verification</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Why should your server be verified?</label>
            <Textarea
              placeholder="Describe what makes your server special and worthy of verification..."
              value={applicationData.description}
              onChange={(e) => setApplicationData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Community Guidelines</label>
            <Textarea
              placeholder="Describe your community guidelines and rules..."
              value={applicationData.community_guidelines}
              onChange={(e) => setApplicationData(prev => ({ ...prev, community_guidelines: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Moderation Information</label>
            <Textarea
              placeholder="Describe your moderation team and practices..."
              value={applicationData.moderation_info}
              onChange={(e) => setApplicationData(prev => ({ ...prev, moderation_info: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Information</label>
            <Textarea
              placeholder="Any additional information you'd like to share..."
              value={applicationData.additional_info}
              onChange={(e) => setApplicationData(prev => ({ ...prev, additional_info: e.target.value }))}
            />
          </div>

          <Button 
            onClick={submitVerificationRequest} 
            disabled={submitting || !applicationData.description}
            className="w-full"
          >
            {submitting ? "Submitting..." : "Submit Verification Request"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Admin view
  if (adminView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Verification Management</h2>
          <Badge variant="secondary">{requests.length} requests</Badge>
        </div>

        <div className="grid gap-6">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {request.listings.name}
                    <VerificationBadge 
                      status={request.verification_status}
                      level={request.verification_level}
                    />
                  </CardTitle>
                  <Badge variant="outline">{request.listings.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Members:</strong> {request.listings.member_count.toLocaleString()}
                  </div>
                  <div>
                    <strong>Requested Level:</strong> {request.verification_level}
                  </div>
                </div>

                {request.verification_criteria && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Application Details:</h4>
                    <div className="space-y-2 text-sm">
                      {request.verification_criteria.description && (
                        <div>
                          <strong>Description:</strong>
                          <p className="text-muted-foreground mt-1">{request.verification_criteria.description}</p>
                        </div>
                      )}
                      {request.verification_criteria.community_guidelines && (
                        <div>
                          <strong>Community Guidelines:</strong>
                          <p className="text-muted-foreground mt-1">{request.verification_criteria.community_guidelines}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {request.verification_status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateVerificationStatus(request.id, 'verified')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        const reason = prompt('Reason for rejection:');
                        if (reason) {
                          updateVerificationStatus(request.id, 'rejected', reason);
                        }
                      }}
                      variant="destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {request.verification_status === 'rejected' && request.rejection_reason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2 text-red-700 mb-1">
                      <AlertCircle className="h-4 w-4" />
                      <strong>Rejection Reason:</strong>
                    </div>
                    <p className="text-sm text-red-600">{request.rejection_reason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {requests.length === 0 && (
          <Card className="p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Verification Requests</h3>
            <p className="text-muted-foreground">
              No servers have applied for verification yet.
            </p>
          </Card>
        )}
      </div>
    );
  }

  return null;
};

export default VerificationSystem;