import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import ModernLayout from '@/components/layout/ModernLayout';
import ModernCard from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ModernBotCard } from '@/components/cards/ModernBotCard';
import { Bot, Search } from 'lucide-react';

interface BotListing {
  id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  bot_id: string | null;
  library: string | null;
  github_url: string | null;
  commands_count: number;
  guilds_count: number;
  certified_bot: boolean;
  vote_count: number;
  monthly_votes: number;
  invite_url: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    subscription_tier: 'free' | 'gold' | 'platinum' | 'premium';
  }[] | null;
  hasVotedToday?: boolean;
}

const Bots = () => {
  const [bots, setBots] = useState<BotListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'votes' | 'newest' | 'guilds'>('votes');
  const { toast } = useToast();

  useEffect(() => {
    fetchBots();
  }, [sortBy]);

  const fetchBots = async () => {
    try {
      setLoading(true);
      
      let orderBy = 'vote_count';
      let ascending = false;
      
      switch (sortBy) {
        case 'newest':
          orderBy = 'created_at';
          break;
        case 'guilds':
          orderBy = 'guilds_count';
          break;
        default:
          orderBy = 'vote_count';
      }

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('type', 'bot')
        .eq('status', 'active')
        .order(orderBy, { ascending })
        .limit(50);

      if (error) throw error;

      // Keep the profiles data instead of nullifying it
      const transformedData = data || [];

      setBots(transformedData);
    } catch (error: any) {
      console.error('Error fetching bots:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch bots"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBots = bots.filter(bot =>
    bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bot.library && bot.library.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleVoteSuccess = (botId: string) => {
    setBots(prev => prev.map(bot => 
      bot.id === botId 
        ? { ...bot, vote_count: bot.vote_count + 1, hasVotedToday: true }
        : bot
    ));
  };

  if (loading) {
    return (
      <ModernLayout>
        <Navbar />
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
          <ModernCard className="p-8">
            <div className="text-2xl font-bold">Loading bots...</div>
          </ModernCard>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <Navbar />
      <Breadcrumbs />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <ModernCard className="p-12 mb-12" variant="gradient">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full mb-8">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Discord Bots</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6">
              Discover
              <span className="block bg-gradient-to-r from-primary via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Amazing Bots
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-4xl leading-relaxed">
              Find the perfect Discord bots to enhance your server. Vote for your favorites and discover new functionality.
            </p>
          </ModernCard>

          {/* Search and Filters */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search bots..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 rounded-xl"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={sortBy === 'votes' ? 'default' : 'outline'}
                onClick={() => setSortBy('votes')}
                className="rounded-xl"
              >
                Top Voted
              </Button>
              <Button
                variant={sortBy === 'newest' ? 'default' : 'outline'}
                onClick={() => setSortBy('newest')}
                className="rounded-xl"
              >
                Newest
              </Button>
              <Button
                variant={sortBy === 'guilds' ? 'default' : 'outline'}
                onClick={() => setSortBy('guilds')}
                className="rounded-xl"
              >
                Most Used
              </Button>
            </div>
          </div>

          {/* Bots Grid */}
          {filteredBots.length === 0 ? (
            <ModernCard className="p-16 text-center" variant="glass">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <div className="text-2xl font-bold mb-2">No bots found</div>
              <div className="text-muted-foreground text-lg">Try adjusting your search criteria</div>
            </ModernCard>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBots.map((bot) => (
              <ModernBotCard
                key={bot.id}
                bot={bot}
                onVoteSuccess={handleVoteSuccess}
              />
            ))}
          </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
};

export default Bots;