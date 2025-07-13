import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { Heart, Clock } from 'lucide-react';

interface VoteButtonProps {
  targetId: string;
  targetType: 'server' | 'bot';
  currentVotes: number;
  hasVotedToday?: boolean;
  onVoteSuccess?: () => void;
}

export const VoteButton = ({ 
  targetId, 
  targetType, 
  currentVotes, 
  hasVotedToday = false,
  onVoteSuccess 
}: VoteButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(hasVotedToday);
  const [voteCount, setVoteCount] = useState(currentVotes);
  const { user } = useAuth();
  const { toast } = useToast();
  const { trackActivity } = useActivityTracker();

  const handleVote = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to vote"
      });
      return;
    }

    if (voted) {
      toast({
        variant: "destructive", 
        title: "Already Voted",
        description: "You can only vote once per day"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('handle_vote', {
        p_user_id: user.id,
        p_target_id: targetId,
        p_target_type: targetType,
        p_ip_address: null
      });

      if (error) throw error;

      if (data) {
        setVoted(true);
        setVoteCount(prev => prev + 1);
        onVoteSuccess?.();
        
        // Track the vote activity
        await trackActivity({
          activity_type: 'vote_cast',
          target_type: targetType,
          target_id: targetId,
          metadata: { vote_count: voteCount + 1 }
        });
        
        toast({
          title: "Vote Submitted!",
          description: `Thank you for voting for this ${targetType}!`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Already Voted",
          description: "You have already voted today"
        });
      }
    } catch (error: any) {
      console.error('Vote error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit vote"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <Button
        onClick={handleVote}
        disabled={loading || voted}
        className={`flex items-center space-x-2 px-6 py-3 text-lg font-bold rounded-2xl transition-all duration-300 ${
          voted 
            ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-gray-300 cursor-not-allowed'
            : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white transform hover:scale-105 shadow-lg hover:shadow-pink-500/25'
        }`}
      >
        {voted ? (
          <>
            <Clock className="h-5 w-5" />
            <span>Voted Today</span>
          </>
        ) : (
          <>
            <Heart className="h-5 w-5" />
            <span>{loading ? 'Voting...' : 'Vote'}</span>
          </>
        )}
      </Button>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-white">{voteCount.toLocaleString()}</div>
        <div className="text-sm text-gray-400">Total Votes</div>
      </div>
    </div>
  );
};