import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Star, Crown, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkSubscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifySubscription = async () => {
      if (!sessionId) {
        setLoading(false);
        return;
      }

      try {
        // Wait a moment for Stripe to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refresh subscription status
        await checkSubscription();
        setVerified(true);
      } catch (error) {
        console.error('Error verifying subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    verifySubscription();
  }, [sessionId, checkSubscription]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4 bg-slate-800/90 border-slate-700">
          <CardContent className="pt-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Processing your subscription...
            </h2>
            <p className="text-slate-400">
              Please wait while we confirm your payment
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full bg-slate-800/90 border-slate-700 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white mb-2">
            Welcome to Premium!
          </CardTitle>
          <CardDescription className="text-slate-400">
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-300">Payment Confirmed</h3>
                <p className="text-green-200 text-sm">
                  Your premium features are now active!
                </p>
              </div>
            </div>
          </div>

          {/* Premium Benefits */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Your Premium Benefits:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-slate-300">
                <Star className="h-4 w-4 text-yellow-400" />
                <span>Premium bot accents and badges</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <Crown className="h-4 w-4 text-purple-400" />
                <span>Priority listing placement</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span>Advanced analytics and insights</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <ArrowRight className="h-4 w-4 text-blue-400" />
                <span>Enhanced bump features</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-12"
            >
              Go to Dashboard
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => navigate('/listings')}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                View Listings
              </Button>
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Manage Profile
              </Button>
            </div>
          </div>

          {/* Session Info */}
          {sessionId && (
            <div className="text-center pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500">
                Session ID: {sessionId.substring(0, 20)}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;