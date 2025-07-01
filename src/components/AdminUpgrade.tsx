
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Crown } from 'lucide-react';

const AdminUpgrade = () => {
  const { user, session } = useAuth();
  const { checkSubscription, isPremium } = useSubscription();
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (!session) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in first",
      });
      return;
    }

    try {
      console.log('Upgrading account to premium...');
      const { data, error } = await supabase.functions.invoke('admin-upgrade', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      console.log('Upgrade response:', data);
      
      toast({
        title: "Account Upgraded!",
        description: "Your account has been upgraded to Premium for testing.",
      });

      // Refresh subscription status
      await checkSubscription();
    } catch (error) {
      console.error('Error upgrading account:', error);
      toast({
        variant: "destructive",
        title: "Upgrade Error",
        description: "Failed to upgrade account. Please try again.",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleUpgrade}
        disabled={isPremium}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
      >
        <Crown className="h-4 w-4 mr-2" />
        {isPremium ? "Premium Active" : "Upgrade to Premium (Test)"}
      </Button>
    </div>
  );
};

export default AdminUpgrade;
