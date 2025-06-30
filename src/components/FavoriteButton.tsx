
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoriteButtonProps {
  listingId: string;
  size?: 'sm' | 'default' | 'lg';
}

const FavoriteButton = ({ listingId, size = 'sm' }: FavoriteButtonProps) => {
  const { toggleFavorite, isFavorited } = useFavorites();
  const favorited = isFavorited(listingId);

  return (
    <Button
      onClick={() => toggleFavorite(listingId)}
      variant="outline"
      size={size}
      className={`border-gray-600 hover:bg-gray-800 rounded-xl ${
        favorited 
          ? 'text-red-400 border-red-500/50 hover:text-red-300' 
          : 'text-gray-300 hover:text-white'
      }`}
    >
      <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
    </Button>
  );
};

export default FavoriteButton;
