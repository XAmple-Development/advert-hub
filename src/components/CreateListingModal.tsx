
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    type: 'server' as 'server' | 'bot',
    discord_id: '',
    invite_url: '',
    website_url: '',
    support_server_url: '',
    category_id: ''
  });
  const { toast } = useToast();

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
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          long_description: formData.long_description,
          type: formData.type,
          discord_id: formData.discord_id,
          invite_url: formData.invite_url || null,
          website_url: formData.website_url || null,
          support_server_url: formData.support_server_url || null,
          status: 'pending'
        })
        .select()
        .single();

      if (listingError) throw listingError;

      // Add category if selected
      if (formData.category_id) {
        const { error: categoryError } = await supabase
          .from('listing_categories')
          .insert({
            listing_id: listing.id,
            category_id: formData.category_id
          });

        if (categoryError) throw categoryError;
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
        type: 'server',
        discord_id: '',
        invite_url: '',
        website_url: '',
        support_server_url: '',
        category_id: ''
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
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
              placeholder="Enter server/bot name"
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
              placeholder="Enter Discord server/bot ID"
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
              placeholder="Detailed description of your server/bot"
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
                placeholder="https://discord.gg/..."
              />
            </div>

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
