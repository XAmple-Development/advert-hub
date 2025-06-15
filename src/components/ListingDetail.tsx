
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Server, 
  Bot, 
  Users, 
  Eye, 
  TrendingUp, 
  ExternalLink, 
  ArrowLeft,
  Calendar,
  Globe
} from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Listing {
  id: string;
  type: 'server' | 'bot';
  name: string;
  description: string;
  long_description?: string;
  member_count: number;
  view_count: number;
  bump_count: number;
  status: string;
  created_at: string;
  avatar_url?: string;
  invite_url?: string;
  website_url?: string;
  discord_id: string;
  tags: string[];
  banner_url?: string;
}

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchListing();
      incrementView();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      setListing(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch listing details",
      });
      navigate('/listings');
    } finally {
      setLoading(false);
    }
  };

  const incrementView = async () => {
    try {
      // First get the current view count
      const { data: currentListing, error: fetchError } = await supabase
        .from('listings')
        .select('view_count')
        .eq('id', id)
        .single();

      if (!fetchError && currentListing) {
        // Increment the view count
        await supabase
          .from('listings')
          .update({ view_count: (currentListing.view_count || 0) + 1 })
          .eq('id', id);
      }
    } catch (error) {
      // Silent fail for view counting
      console.log('Failed to increment view count:', error);
    }
  };

  const handleBump = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to bump listings",
      });
      return;
    }

    if (!listing) return;

    try {
      const { error } = await supabase
        .from('bumps')
        .insert({
          listing_id: listing.id,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Listing bumped to the top!",
      });

      // Refresh the listing to show updated bump count
      fetchListing();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleJoin = () => {
    if (listing?.invite_url) {
      window.open(listing.invite_url, '_blank');
    }
  };

  const handleWebsite = () => {
    if (listing?.website_url) {
      window.open(listing.website_url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2C2F33]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-white text-xl">Loading listing...</div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#2C2F33]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-white text-xl">Listing not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2C2F33]">
      <Navbar />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-6">
          <Button
            onClick={() => navigate('/listings')}
            variant="outline"
            className="mb-6 border-[#40444B] text-gray-300 hover:bg-[#40444B]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listings
          </Button>

          <Card className="bg-[#36393F] border-[#40444B]">
            {listing.banner_url && (
              <div className="h-48 bg-cover bg-center rounded-t-lg" 
                   style={{ backgroundImage: `url(${listing.banner_url})` }} />
            )}
            
            <CardHeader className="pb-4">
              <div className="flex items-start space-x-4">
                {listing.avatar_url ? (
                  <img
                    src={listing.avatar_url}
                    alt={listing.name}
                    className="w-16 h-16 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-[#5865F2] rounded-full flex items-center justify-center flex-shrink-0">
                    {listing.type === 'server' ? (
                      <Server className="h-8 w-8 text-white" />
                    ) : (
                      <Bot className="h-8 w-8 text-white" />
                    )}
                  </div>
                )}
                
                <div className="flex-1">
                  <CardTitle className="text-white text-2xl mb-2">{listing.name}</CardTitle>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={listing.type === 'server' ? 'default' : 'secondary'}>
                      {listing.type}
                    </Badge>
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(listing.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  
                  {listing.tags && listing.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {listing.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                <p className="text-gray-300 leading-relaxed">
                  {listing.long_description || listing.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#2C2F33] rounded-lg">
                  <div className="flex items-center justify-center text-gray-400 mb-2">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="text-white font-semibold text-xl">{listing.member_count.toLocaleString()}</div>
                  <div className="text-gray-500 text-sm">Members</div>
                </div>
                <div className="text-center p-4 bg-[#2C2F33] rounded-lg">
                  <div className="flex items-center justify-center text-gray-400 mb-2">
                    <Eye className="h-5 w-5" />
                  </div>
                  <div className="text-white font-semibold text-xl">{listing.view_count || 0}</div>
                  <div className="text-gray-500 text-sm">Views</div>
                </div>
                <div className="text-center p-4 bg-[#2C2F33] rounded-lg">
                  <div className="flex items-center justify-center text-gray-400 mb-2">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div className="text-white font-semibold text-xl">{listing.bump_count || 0}</div>
                  <div className="text-gray-500 text-sm">Bumps</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {listing.invite_url && (
                  <Button
                    onClick={handleJoin}
                    className="flex-1 bg-[#57F287] hover:bg-[#3BA55C] text-black"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join {listing.type === 'server' ? 'Server' : 'Bot'}
                  </Button>
                )}
                
                {listing.website_url && (
                  <Button
                    onClick={handleWebsite}
                    variant="outline"
                    className="flex-1 border-[#40444B] text-gray-300 hover:bg-[#40444B]"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </Button>
                )}
                
                <Button
                  onClick={handleBump}
                  variant="outline"
                  className="border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Bump Listing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;
