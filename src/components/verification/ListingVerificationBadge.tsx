import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import VerificationBadge from './VerificationBadge';

interface ListingVerificationBadgeProps {
  listingId: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const ListingVerificationBadge = ({ 
  listingId, 
  size = 'sm', 
  showTooltip = true 
}: ListingVerificationBadgeProps) => {
  const [verificationStatus, setVerificationStatus] = useState<{
    status: 'pending' | 'verified' | 'rejected' | null;
    level?: 'basic' | 'premium' | 'partner';
  }>({ status: null });

  useEffect(() => {
    const fetchVerification = async () => {
      console.log('Fetching verification for listing:', listingId);
      try {
        const { data, error } = await supabase
          .from('server_verification')
          .select('verification_status, verification_level')
          .eq('listing_id', listingId)
          .maybeSingle();

        console.log('Verification query result:', { data, error });

        if (error) {
          console.error('Error fetching verification:', error);
          return;
        }

        if (data) {
          console.log('Setting verification status:', data);
          setVerificationStatus({
            status: data.verification_status as 'pending' | 'verified' | 'rejected',
            level: data.verification_level as 'basic' | 'premium' | 'partner' || 'basic'
          });
        } else {
          console.log('No verification data found for listing:', listingId);
        }
      } catch (error) {
        console.error('Error fetching verification:', error);
      }
    };

    fetchVerification();
  }, [listingId]);

  return (
    <VerificationBadge 
      status={verificationStatus.status}
      level={verificationStatus.level}
      size={size}
      showTooltip={showTooltip}
    />
  );
};

export default ListingVerificationBadge;