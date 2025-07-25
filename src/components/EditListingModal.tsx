
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Listing {
  id: string;
  type: 'server' | 'bot';
  name: string;
  description: string;
  long_description?: string;
  invite_url?: string;
  website_url?: string;
  support_server_url?: string;
  youtube_trailer?: string;
}

interface EditListingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing | null;
  onSuccess: () => void;
}

const editListingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  long_description: z.string().optional(),
  invite_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  website_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  support_server_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  youtube_trailer: z.string().url('Must be a valid YouTube URL').optional().or(z.literal('')),
});

type EditListingFormData = z.infer<typeof editListingSchema>;

const EditListingModal = ({ open, onOpenChange, listing, onSuccess }: EditListingModalProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Don't render if no listing provided
  if (!listing) {
    return null;
  }

  const form = useForm<EditListingFormData>({
    resolver: zodResolver(editListingSchema),
    defaultValues: {
      name: listing.name || '',
      description: listing.description || '',
      long_description: listing.long_description || '',
      invite_url: listing.invite_url || '',
      website_url: listing.website_url || '',
      support_server_url: listing.support_server_url || '',
      youtube_trailer: listing.youtube_trailer || '',
    },
  });

  // Reset form when listing changes
  useEffect(() => {
    if (listing) {
      form.reset({
        name: listing.name || '',
        description: listing.description || '',
        long_description: listing.long_description || '',
        invite_url: listing.invite_url || '',
        website_url: listing.website_url || '',
        support_server_url: listing.support_server_url || '',
        youtube_trailer: listing.youtube_trailer || '',
      });
    }
  }, [listing, form]);

  const onSubmit = async (data: EditListingFormData) => {
    if (!listing) return;
    
    setLoading(true);
    
    try {
      const updateData = {
        name: data.name.trim(),
        description: data.description.trim(),
        long_description: data.long_description?.trim() || null,
        invite_url: data.invite_url?.trim() || null,
        website_url: data.website_url?.trim() || null,
        support_server_url: data.support_server_url?.trim() || null,
        youtube_trailer: data.youtube_trailer?.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listing.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Your listing has been updated successfully.",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update listing. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#36393F] border-[#40444B]">
        <DialogHeader>
          <DialogTitle className="text-white">Edit {listing.type === 'server' ? 'Server' : 'Bot'}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update your {listing.type} information and settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-[#40444B] border-[#565A5E] text-white placeholder-gray-400"
                      placeholder={`Enter ${listing.type} name`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-[#40444B] border-[#565A5E] text-white placeholder-gray-400"
                      placeholder="Brief description for listings"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="long_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Detailed Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-[#40444B] border-[#565A5E] text-white placeholder-gray-400"
                      placeholder="Detailed description for the listing page"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invite_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">
                    {listing.type === 'server' ? 'Invite URL' : 'Invite URL'} (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-[#40444B] border-[#565A5E] text-white placeholder-gray-400"
                      placeholder={listing.type === 'server' ? 'https://discord.gg/...' : 'https://discord.com/api/oauth2/...'}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Website URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-[#40444B] border-[#565A5E] text-white placeholder-gray-400"
                      placeholder="https://example.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="support_server_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Support Server URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-[#40444B] border-[#565A5E] text-white placeholder-gray-400"
                      placeholder="https://discord.gg/support"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="youtube_trailer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">YouTube Trailer URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="bg-[#40444B] border-[#565A5E] text-white placeholder-gray-400"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-[#40444B] text-gray-300 hover:bg-[#40444B]"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update {listing.type === 'server' ? 'Server' : 'Bot'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditListingModal;
