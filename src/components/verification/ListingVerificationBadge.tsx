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
      try {
        const { data, error } = await supabase
          .from('server_verification')
          .select('verification_status, verification_level')
          .eq('listing_id', listingId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching verification:', error);
          return;
        }

        if (data) {
          setVerificationStatus({
            status: data.verification_status as 'pending' | 'verified' | 'rejected',
            level: data.verification_level as 'basic' | 'premium' | 'partner' || 'basic'
          });
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