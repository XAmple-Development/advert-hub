import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { useToast } from '@/hooks/use-toast';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Flag, Edit, Trash2, Users } from 'lucide-react';
import { EnhancedLoadingSpinner, LoadingStateManager } from '@/components/enhanced/EnhancedLoadingStates';
import { Link } from 'react-router-dom';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  listing_id: string;
  helpful_count?: number;
  profiles?: {
    username?: string;
    discord_avatar?: string;
    discord_username?: string;
  } | null;
}

interface ReviewSystemProps {
  listingId: string;
  averageRating?: number;
  totalReviews?: number;
}

const StarRating = ({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = 'md' 
}: { 
  rating: number; 
  onRatingChange?: (rating: number) => void; 
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hoverRating || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`${sizeClasses[size]} transition-colors ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            onClick={() => !readonly && onRatingChange?.(star)}
          >
            <Star 
              className={`w-full h-full ${
                filled 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-gray-300 dark:text-gray-600'
              }`} 
            />
          </button>
        );
      })}
    </div>
  );
};

const ReviewStats = ({ reviews }: { reviews: Review[] }) => {
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => 
    reviews.filter(review => review.rating === rating).length
  );
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Review Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
          <StarRating rating={Math.round(averageRating)} readonly size="lg" />
          <div className="text-sm text-muted-foreground mt-1">
            Based on {totalReviews} reviews
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating, index) => (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm w-8">{rating}</span>
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              <Progress 
                value={totalReviews > 0 ? (ratingCounts[index] / totalReviews) * 100 : 0} 
                className="flex-1 h-2" 
              />
              <span className="text-sm text-muted-foreground w-8 text-right">
                {ratingCounts[index]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ReviewCard = ({ 
  review, 
  canEdit, 
  onEdit, 
  onDelete, 
  onHelpful,
  currentUserId 
}: { 
  review: Review;
  canEdit: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onHelpful?: (helpful: boolean) => void;
  currentUserId?: string;
}) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [voteType, setVoteType] = useState<boolean | null>(null);

  useEffect(() => {
    if (currentUserId && review.id) {
      checkExistingVote();
    }
  }, [currentUserId, review.id]);

  const checkExistingVote = async () => {
    if (!currentUserId) return;
    
    try {
      const { data, error } = await supabase
        .from('review_helpfulness')
        .select('helpful')
        .eq('review_id', review.id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setHasVoted(true);
        setVoteType(data.helpful);
      }
    } catch (error) {
      console.error('Error checking vote:', error);
    }
  };

  const handleHelpfulVote = async (helpful: boolean) => {
    if (!currentUserId || !onHelpful) return;
    
    try {
      if (hasVoted) {
        // Update existing vote
        const { error } = await supabase
          .from('review_helpfulness')
          .update({ helpful })
          .eq('review_id', review.id)
          .eq('user_id', currentUserId);
        
        if (error) throw error;
      } else {
        // Create new vote
        const { error } = await supabase
          .from('review_helpfulness')
          .insert({
            review_id: review.id,
            user_id: currentUserId,
            helpful
          });
        
        if (error) throw error;
      }
      
      setHasVoted(true);
      setVoteType(helpful);
      onHelpful(helpful);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="bg-card/30 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={review.profiles?.discord_avatar} />
            <AvatarFallback>
              <Users className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  <Link 
                    to={`/profile/${review.user_id}`}
                    className="hover:text-primary transition-colors cursor-pointer"
                  >
                    {review.profiles?.discord_username || review.profiles?.username || 'Anonymous'}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} readonly size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(review.created_at)}
                  </span>
                </div>
              </div>
              
              {canEdit && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={onEdit}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onDelete}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            
            <p className="text-sm">{review.comment}</p>
            
            <div className="flex items-center gap-2 pt-2">
              {currentUserId ? (
                <div className="flex gap-1">
                  <Button 
                    variant={voteType === true ? "default" : "ghost"} 
                    size="sm" 
                    onClick={() => handleHelpfulVote(true)}
                    disabled={hasVoted && voteType === true}
                  >
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    Helpful ({review.helpful_count || 0})
                  </Button>
                  <Button 
                    variant={voteType === false ? "destructive" : "ghost"} 
                    size="sm" 
                    onClick={() => handleHelpfulVote(false)}
                    disabled={hasVoted && voteType === false}
                  >
                    <ThumbsDown className="h-3 w-3 mr-1" />
                    Not Helpful
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" disabled>
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Helpful ({review.helpful_count || 0})
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Flag className="h-3 w-3 mr-1" />
                Report
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ReviewForm = ({ 
  listingId, 
  existingReview, 
  onSubmit, 
  onCancel 
}: {
  listingId: string;
  existingReview?: Review;
  onSubmit: () => void;
  onCancel?: () => void;
}) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;

    setSubmitting(true);
    try {
      if (existingReview) {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update({ rating, comment })
          .eq('id', existingReview.id);

        if (error) throw error;
        
        toast({
          title: 'Review updated!',
          description: 'Your review has been updated successfully.',
        });
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert([{
            listing_id: listingId,
            user_id: user.id,
            rating,
            comment
          }]);

        if (error) throw error;
        
        
        toast({
          title: 'Review submitted!',
          description: 'Thank you for your feedback.',
        });
      }

      onSubmit();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit review',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle>
          {existingReview ? 'Edit Your Review' : 'Write a Review'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Your Rating</Label>
            <div className="mt-2">
              <StarRating rating={rating} onRatingChange={setRating} size="lg" />
            </div>
          </div>
          
          <div>
            <Label htmlFor="comment">Your Review</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this community..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-2 min-h-[100px]"
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {comment.length}/1000
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={rating === 0 || submitting}
              className="flex-1"
            >
              {submitting ? (
                <EnhancedLoadingSpinner size="sm" className="mr-2" />
              ) : null}
              {existingReview ? 'Update Review' : 'Submit Review'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export const ReviewSystem = ({ listingId }: ReviewSystemProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
      
      // Find user's existing review
      if (user) {
        const existingReview = data?.find(review => review.user_id === user.id);
        setUserReview(existingReview || null);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [listingId, user]);

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: 'Review deleted',
        description: 'Your review has been removed.',
      });

      fetchReviews();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete review',
      });
    }
  };

  const handleHelpfulVote = async (reviewId: string, helpful: boolean) => {
    try {
      // Recalculate helpful count
      const { data: helpfulData, error: helpfulError } = await supabase
        .from('review_helpfulness')
        .select('helpful')
        .eq('review_id', reviewId);

      if (helpfulError) throw helpfulError;

      const helpfulCount = helpfulData?.filter(vote => vote.helpful).length || 0;

      // Update review helpful_count
      const { error: updateError } = await supabase
        .from('reviews')
        .update({ helpful_count: helpfulCount })
        .eq('id', reviewId);

      if (updateError) throw updateError;

      // Refresh reviews to show updated counts
      fetchReviews();
    } catch (error) {
      console.error('Error updating helpful count:', error);
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingReview(null);
    fetchReviews();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reviews Statistics */}
        <div className="lg:col-span-1">
          <ReviewStats reviews={reviews} />
        </div>

        {/* Review Actions */}
        <div className="lg:col-span-2 space-y-4">
          {user ? (
            userReview ? (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Your Review</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={userReview.rating} readonly size="sm" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(userReview.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingReview(userReview);
                          setShowForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReview(userReview.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  {userReview.comment && (
                    <p className="text-sm mt-2">{userReview.comment}</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Share Your Experience</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Help others by writing a review about this community
                  </p>
                  <Button onClick={() => setShowForm(true)}>
                    Write a Review
                  </Button>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-2">Sign In to Review</h3>
                <p className="text-sm text-muted-foreground">
                  You need to be signed in to write a review
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          listingId={listingId}
          existingReview={editingReview}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingReview(null);
          }}
        />
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Reviews ({reviews.length})</h3>
        
        <LoadingStateManager
          isLoading={loading}
          isError={!!error}
          isEmpty={reviews.length === 0}
          error={error}
          onRetry={fetchReviews}
          loadingComponent={
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="bg-card/30 border-border/50">
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-24" />
                          <div className="h-3 bg-muted rounded w-32" />
                        </div>
                      </div>
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }
          emptyComponent={
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">No Reviews Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Be the first to share your experience with this community!
                </p>
              </CardContent>
            </Card>
          }
        >
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {reviews
                .filter(review => review.user_id !== user?.id) // Hide user's own review from list
                .map((review) => (
                   <ReviewCard
                     key={review.id}
                     review={review}
                     canEdit={false}
                     currentUserId={user?.id}
                     onHelpful={(helpful) => handleHelpfulVote(review.id, helpful)}
                   />
                ))}
            </div>
          </ScrollArea>
        </LoadingStateManager>
      </div>
    </div>
  );
};