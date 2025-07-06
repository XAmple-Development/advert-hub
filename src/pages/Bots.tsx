import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { VoteButton } from '@/components/VoteButton';
import { Bot, ExternalLink, Github, Star, Users, Code, Crown, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    username: string | null;
    discord_username: string | null;
  } | null;
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
        .select(`
          *,
          profiles(username, discord_username)
        `)
        .eq('type', 'bot')
        .eq('status', 'active')
        .not('bot_id', 'is', null)
        .order(orderBy, { ascending })
        .limit(50);

      if (error) throw error;

      setBots(data || []);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <Navbar />
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
          <div className="text-2xl font-bold text-white">Loading bots...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <Navbar />
      <Breadcrumbs />
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-8 backdrop-blur-sm">
              <Bot className="h-4 w-4 text-purple-300" />
              <span className="text-purple-200 font-medium">Discord Bots</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              Discover
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Amazing Bots
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl leading-relaxed">
              Find the perfect Discord bots to enhance your server. Vote for your favorites and discover new functionality.
            </p>
          </div>

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
            <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
              <CardContent className="py-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full mb-6">
                  <Bot className="h-10 w-10 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white mb-2">No bots found</div>
                <div className="text-gray-300 text-lg">Try adjusting your search criteria</div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBots.map((bot) => (
                <Card key={bot.id} className="group bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 rounded-3xl overflow-hidden">
                  <CardHeader className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        {bot.avatar_url ? (
                          <img
                            src={bot.avatar_url}
                            alt={bot.name}
                            className="w-12 h-12 rounded-xl"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                            <Bot className="h-6 w-6 text-white" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                            {bot.name}
                            {bot.certified_bot && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </CardTitle>
                          <p className="text-gray-400 text-sm">
                            by {bot.profiles?.discord_username || bot.profiles?.username || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      
                      <VoteButton
                        targetId={bot.id}
                        targetType="bot"
                        currentVotes={bot.vote_count}
                        hasVotedToday={bot.hasVotedToday}
                        onVoteSuccess={() => handleVoteSuccess(bot.id)}
                      />
                    </div>

                    <CardDescription className="text-gray-300 text-base mb-4">
                      {bot.description}
                    </CardDescription>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {bot.library && (
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          {bot.library}
                        </Badge>
                      )}
                      {bot.certified_bot && (
                        <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30">
                          <Crown className="h-3 w-3 mr-1" />
                          Certified
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {bot.guilds_count.toLocaleString()} servers
                      </div>
                      <div className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        {bot.commands_count} commands
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="px-6 pb-6">
                    <div className="flex gap-2">
                      {bot.invite_url && (
                        <Button
                          asChild
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl"
                        >
                          <a href={bot.invite_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Invite Bot
                          </a>
                        </Button>
                      )}
                      
                      <Button
                        asChild
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl"
                      >
                        <Link to={`/listings/${bot.id}`}>
                          View Details
                        </Link>
                      </Button>
                      
                      {bot.github_url && (
                        <Button
                          asChild
                          variant="outline"
                          size="icon"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 rounded-xl"
                        >
                          <a href={bot.github_url} target="_blank" rel="noopener noreferrer">
                            <Github className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bots;