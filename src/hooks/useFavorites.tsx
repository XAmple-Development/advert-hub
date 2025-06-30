
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('listing_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data?.map(f => f.listing_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (listingId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Sign in required",
        description: "Please sign in to favorite servers",
      });
      return;
    }

    const isFavorited = favorites.includes(listingId);

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('listing_id', listingId);

        if (error) throw error;
        setFavorites(prev => prev.filter(id => id !== listingId));
        
        toast({
          title: "Removed from favorites",
          description: "Server removed from your favorites",
        });
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            listing_id: listingId
          });

        if (error) throw error;
        setFavorites(prev => [...prev, listingId]);
        
        toast({
          title: "Added to favorites",
          description: "Server added to your favorites",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update favorites",
      });
    }
  };

  const isFavorited = (listingId: string) => favorites.includes(listingId);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorited
  };
};
