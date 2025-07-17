import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  Check,
  X,
  Edit,
  Trash2,
  User,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface Review {
  id: string;
  user_id: string;
  listing_id: string;
  rating: number;
  comment: string;
  helpful_count: number;
  verified_purchase: boolean;
  created_at: string;
  profiles?: {
    username: string;
    discord_username: string;
    discord_avatar: string;
  } | null;
}

interface ReviewSystemProps {
  listingId: string;
  showWriteReview?: boolean;
}

export const ReviewSystem = ({ listingId, showWriteReview = true }: ReviewSystemProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [listingId]);

  const fetchReviews = async () => {
    try {
      // First fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Then fetch user profiles for the reviews
      if (reviewsData && reviewsData.length > 0) {
        const userIds = reviewsData.map(review => review.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, discord_username, discord_avatar')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Combine the data
        const reviewsWithProfiles = reviewsData.map(review => ({
          ...review,
          profiles: profilesData?.find(profile => profile.id === review.user_id) || null
        }));

        console.log('Fetched reviews with profiles:', reviewsWithProfiles);
        setReviews(reviewsWithProfiles);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !rating || submitting) return;

    setSubmitting(true);
    try {
      const reviewData = {
        user_id: user.id,
        listing_id: listingId,
        rating,
        comment: reviewText.trim() || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', editingId);
        
        if (error) throw error;
        toast({ title: 'Review updated successfully!' });
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert(reviewData);
        
        if (error) throw error;
        toast({ title: 'Review submitted successfully!' });
      }

      setRating(0);
      setReviewText('');
      setShowForm(false);
      setEditingId(null);
      fetchReviews();
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'You have already reviewed this listing',
          description: 'You can edit your existing review instead.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error submitting review',
          description: error.message,
          variant: 'destructive'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const voteOnReview = async (reviewId: string, isHelpful: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('review_helpfulness')
        .upsert({
          user_id: user.id,
          review_id: reviewId,
          helpful: isHelpful
        });

      if (error) throw error;
      
      // Update helpful count
      const review = reviews.find(r => r.id === reviewId);
      if (review) {
        const increment = isHelpful ? 1 : -1;
        await supabase
          .from('reviews')
          .update({ helpful_count: Math.max(0, review.helpful_count + increment) })
          .eq('id', reviewId);
      }

      fetchReviews();
    } catch (error) {
      console.error('Error voting on review:', error);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({ title: 'Review deleted successfully' });
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: 'Error deleting review',
        variant: 'destructive'
      });
    }
  };

  const reportReview = async (reviewId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('content_flags')
        .insert({
          reporter_id: user.id,
          target_type: 'review',
          target_id: reviewId,
          flag_type: 'inappropriate',
          reason: 'Inappropriate content reported by user'
        });

      if (error) throw error;
      toast({ title: 'Review reported successfully' });
    } catch (error) {
      console.error('Error reporting review:', error);
      toast({
        title: 'Error reporting review',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setRating(review.rating);
    setReviewText(review.comment || '');
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setRating(0);
    setReviewText('');
    setShowForm(false);
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }));

  const userReview = reviews.find(r => r.user_id === user?.id);
  const canWriteReview = user && !userReview && showWriteReview;

  if (loading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Reviews ({reviews.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= averageRating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-400'
                    }`}
                  />
                ))}
              </div>
              <p className="text-gray-400">Based on {reviews.length} reviews</p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm w-8">{star} ★</span>
                  <Progress value={percentage} className="flex-1" />
                  <span className="text-gray-400 text-sm w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Write Review Button */}
          {canWriteReview && (
            <div className="border-t border-gray-700 pt-4">
              <Button 
                onClick={() => setShowForm(true)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Star className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      {showForm && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              {editingId ? 'Edit Review' : 'Write a Review'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-400 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Review (Optional)
                </label>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this server..."
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={!rating || submitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? 'Submitting...' : editingId ? 'Update Review' : 'Submit Review'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                    {review.profiles?.discord_avatar ? (
                      <img 
                        src={review.profiles.discord_avatar} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <User className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                       <span className="text-white font-medium">
                          {review.profiles ? (review.profiles.username || review.profiles.discord_username || 'Anonymous') : 'Anonymous'}
                       </span>
                       {review.verified_purchase && (
                         <Badge className="bg-green-600 text-white text-xs">
                           <Check className="h-3 w-3 mr-1" />
                           Verified
                         </Badge>
                       )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Review Text */}
              {review.comment && (
                <p className="text-gray-300 mb-4">{review.comment}</p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {user && user.id !== review.user_id && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => voteOnReview(review.id, true)}
                        className="text-gray-400 hover:text-green-400"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful ({review.helpful_count})
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => reportReview(review.id)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Flag className="h-4 w-4 mr-1" />
                        Report
                      </Button>
                    </>
                  )}
                </div>

                {/* User's own review actions */}
                {user && user.id === review.user_id && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(review)}
                      className="text-gray-400 hover:text-blue-400"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteReview(review.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {reviews.length === 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">No reviews yet</h3>
              <p className="text-gray-400">Be the first to review this server!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};