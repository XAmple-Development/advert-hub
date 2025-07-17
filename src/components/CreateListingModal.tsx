
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';


interface CreateListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
}

const CreateListingModal = ({ open, onOpenChange, onSuccess }: CreateListingModalProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    long_description: '',
    type: 'bot' as 'server' | 'bot',
    discord_id: '',
    invite_url: '',
    website_url: '',
    support_server_url: '',
    avatar_url: '',
    banner_url: '',
    youtube_trailer: '',
    category_id: ''
  });
  const { toast } = useToast();
  const authData = useAuth();
  const { isPremium } = useSubscription();
  const { canAddYoutubeTrailer, canHaveLargeBanners, listingPriority } = usePremiumFeatures();
  

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load categories",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authData?.user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a listing",
      });
      return;
    }

    if (!formData.name.trim() || !formData.description.trim() || !formData.discord_id.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setLoading(true);

    try {
      // Check listing limit for free users
      if (!isPremium) {
        const { data: existingListings, error: countError } = await supabase
          .from('listings')
          .select('id')
          .eq('user_id', authData.user.id);

        if (countError) throw countError;

        if (existingListings && existingListings.length >= 3) {
          toast({
            variant: "destructive",
            title: "Premium Upgrade Required",
            description: "Free users can create up to 3 listings. Upgrade to Premium for unlimited listings and enhanced features.",
          });
          return;
        }
      }

      // Create the listing with premium features if applicable
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id: authData.user.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          long_description: formData.long_description.trim() || null,
          type: formData.type,
          discord_id: formData.discord_id.trim(),
          invite_url: formData.invite_url.trim() || null,
          website_url: formData.website_url.trim() || null,
          support_server_url: formData.support_server_url.trim() || null,
          avatar_url: formData.avatar_url.trim() || null,
          banner_url: formData.banner_url.trim() || null,
          tags: canAddYoutubeTrailer && formData.youtube_trailer.trim() ? 
            ['youtube:' + formData.youtube_trailer.trim()] : null,
          status: 'pending',
          premium_featured: isPremium,
          priority_ranking: listingPriority * 100, // Convert to actual ranking values
          analytics_enabled: isPremium,
          verified_badge: isPremium
        })
        .select()
        .single();

      if (listingError) throw listingError;


      // Add category if selected
      if (formData.category_id && listing) {
        const { error: categoryError } = await supabase
          .from('listing_categories')
          .insert({
            listing_id: listing.id,
            category_id: formData.category_id
          });

        if (categoryError) {
          console.error('Category assignment error:', categoryError);
          // Don't throw here, listing was created successfully
        }
      }

      toast({
        title: "Listing created!",
        description: "Your listing has been submitted for review.",
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        long_description: '',
        type: 'bot',
        discord_id: '',
        invite_url: '',
        website_url: '',
        support_server_url: '',
        avatar_url: '',
        banner_url: '',
        youtube_trailer: '',
        category_id: ''
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Create listing error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create listing. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#36393F] border-[#40444B] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Listing</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add your Discord bot to our network
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value: 'server' | 'bot') => setFormData({ ...formData, type: value })}>
                <SelectTrigger className="bg-[#2C2F33] border-[#40444B]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2C2F33] border-[#40444B]">
                  <SelectItem value="server">Discord Server</SelectItem>
                  <SelectItem value="bot">Discord Bot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger className="bg-[#2C2F33] border-[#40444B]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-[#2C2F33] border-[#40444B]">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-[#2C2F33] border-[#40444B]"
              placeholder="Enter bot name"
            />
          </div>

          <div>
            <Label htmlFor="discord_id">Discord ID *</Label>
            <Input
              id="discord_id"
              value={formData.discord_id}
              onChange={(e) => setFormData({ ...formData, discord_id: e.target.value })}
              required
              className="bg-[#2C2F33] border-[#40444B]"
              placeholder="Enter Discord bot ID"
            />
          </div>

          <div>
            <Label htmlFor="description">Short Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="bg-[#2C2F33] border-[#40444B]"
              placeholder="Brief description (max 200 chars)"
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="long_description">Detailed Description</Label>
            <Textarea
              id="long_description"
              value={formData.long_description}
              onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
              className="bg-[#2C2F33] border-[#40444B]"
              placeholder="Detailed description of your bot"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invite_url">Invite URL</Label>
              <Input
                id="invite_url"
                type="url"
                value={formData.invite_url}
                onChange={(e) => setFormData({ ...formData, invite_url: e.target.value })}
                className="bg-[#2C2F33] border-[#40444B]"
                placeholder="https://discord.com/api/oauth2/..."
              />
            </div>

            <div>
              <Label htmlFor="avatar_url">Avatar/Icon URL</Label>
              <Input
                id="avatar_url"
                type="url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                className="bg-[#2C2F33] border-[#40444B]"
                placeholder="https://example.com/avatar.png"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="banner_url">
              Banner Image URL {canHaveLargeBanners && <span className="text-amber-400">(Large Banner Support)</span>}
            </Label>
            <Input
              id="banner_url"
              type="url"
              value={formData.banner_url}
              onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
              className="bg-[#2C2F33] border-[#40444B]"
              placeholder="https://example.com/banner.png"
            />
          </div>

          {canAddYoutubeTrailer && (
            <div>
              <Label htmlFor="youtube_trailer">
                YouTube Trailer URL <span className="text-amber-400">(Premium Feature)</span>
              </Label>
              <Input
                id="youtube_trailer"
                type="url"
                value={formData.youtube_trailer}
                onChange={(e) => setFormData({ ...formData, youtube_trailer: e.target.value })}
                className="bg-[#2C2F33] border-[#40444B]"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          )}

          <div>
            <Label htmlFor="website_url">Website URL</Label>
            <Input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              className="bg-[#2C2F33] border-[#40444B]"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <Label htmlFor="support_server_url">Support Server URL</Label>
            <Input
              id="support_server_url"
              type="url"
              value={formData.support_server_url}
              onChange={(e) => setFormData({ ...formData, support_server_url: e.target.value })}
              className="bg-[#2C2F33] border-[#40444B]"
              placeholder="https://discord.gg/support"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-400 text-gray-300 hover:bg-gray-800"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#5865F2] hover:bg-[#4752C4]"
            >
              {loading ? 'Creating...' : 'Create Listing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateListingModal;
