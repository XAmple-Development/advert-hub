import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Crown, 
  Star, 
  Zap, 
  Calendar, 
  CreditCard, 
  Download, 
  Settings, 
  ChevronRight,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';

const Subscription = () => {
  const { user } = useAuth();
  const { 
    subscription_tier, 
    subscription_end, 
    subscribed, 
    loading, 
    checkSubscription,
    openCustomerPortal,
    createCheckout,
    isGold,
    isPlatinum,
    isPremium
  } = useSubscription();
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleManageSubscription = async () => {
    setActionLoading(true);
    try {
      if (isPremium) {
        await openCustomerPortal();
      } else {
        await createCheckout();
      }
    } catch (error) {
      console.error('Error managing subscription:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    setActionLoading(true);
    try {
      await checkSubscription();
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getPlanIcon = () => {
    if (isPlatinum) return Crown;
    if (isGold) return Star;
    return Zap;
  };

  const getPlanColor = () => {
    if (isPlatinum) return 'from-slate-400 to-slate-600';
    if (isGold) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-600 to-gray-700';
  };

  const getPlanName = () => {
    if (isPlatinum) return 'Platinum';
    if (isGold) return 'Gold';
    return 'Starter';
  };

  const PlanIcon = getPlanIcon();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Subscription Management</h1>
          <p className="text-gray-400">Manage your subscription, billing, and premium features</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan Card */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${getPlanColor()} rounded-lg flex items-center justify-center`}>
                      <PlanIcon className="h-5 w-5 text-white" />
                    </div>
                    Current Plan
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshSubscription}
                    disabled={loading || actionLoading}
                    className="text-gray-400 hover:text-white"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={isPremium ? "default" : "secondary"}
                    className={`text-lg px-4 py-2 ${
                      isPremium ? 'bg-gradient-to-r from-purple-600 to-pink-600' : ''
                    }`}
                  >
                    {getPlanName()}
                  </Badge>
                  {subscribed && (
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <p className="text-white font-medium">
                      {subscribed ? 'Active' : 'Free Plan'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Tier:</span>
                    <p className="text-white font-medium capitalize">{subscription_tier}</p>
                  </div>
                  {subscription_end && (
                    <div>
                      <span className="text-gray-400">Next Billing:</span>
                      <p className="text-white font-medium">
                        {formatDate(subscription_end)}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">Auto-renewal:</span>
                    <p className="text-white font-medium">
                      {isPremium ? 'Enabled' : 'N/A'}
                    </p>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleManageSubscription}
                    disabled={actionLoading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {isPremium ? 'Manage Subscription' : 'Upgrade Plan'}
                  </Button>
                  
                  {!isPremium && (
                    <Button
                      variant="outline"
                      onClick={() => navigate('/pricing')}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      View All Plans
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isPremium && (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50"
                    onClick={handleManageSubscription}
                    disabled={actionLoading}
                  >
                    <CreditCard className="h-4 w-4 mr-3" />
                    Update Payment Method
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50"
                    onClick={handleManageSubscription}
                    disabled={actionLoading}
                  >
                    <Download className="h-4 w-4 mr-3" />
                    Download Invoices
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50"
                    onClick={handleManageSubscription}
                    disabled={actionLoading}
                  >
                    <Calendar className="h-4 w-4 mr-3" />
                    Change Plan
                  </Button>
                </>
              )}
              
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50"
                onClick={() => navigate('/pricing')}
              >
                <Crown className="h-4 w-4 mr-3" />
                {isPremium ? 'Explore Features' : 'View Premium Plans'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <Card className="mt-6 bg-gray-800/50 border-gray-700 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Plan Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Starter Features */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-300 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Starter (Free)
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    List up to 3 servers/bots
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    Basic bump every 6 hours
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    Community support
                  </li>
                </ul>
              </div>

              {/* Gold Features */}
              <div className="space-y-3">
                <h4 className="font-semibold text-yellow-400 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Gold ($4.79/month)
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    Gold bot accent
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    Higher listing priority
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    1.5x bump power
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    Up to 12 team members
                  </li>
                </ul>
              </div>

              {/* Platinum Features */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-300 flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Platinum ($9.59/month)
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    White bot accent
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    Top listing priority
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    2x bump power
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    Large banner placement
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Note */}
        <Card className="mt-6 bg-blue-900/20 border-blue-700/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-300 mb-1">Need Help?</h4>
                <p className="text-blue-400/80 text-sm">
                  If you have any questions about billing or need assistance with your subscription, 
                  please contact our support team through Discord.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;