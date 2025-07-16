import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import ModernLayout from '@/components/layout/ModernLayout';
import ModernCard from '@/components/ui/modern-card';

const Pricing = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const { subscribed, subscription_tier, subscription_end } = useSubscription();
  const subscription = {
    subscribed,
    subscription_tier,
    subscription_end
  };
  const { toast } = useToast();

  const handleSubscribe = async (plan: 'gold' | 'platinum') => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan.",
      });
      return;
    }

    setLoading(plan);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan }
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: error.message || "Failed to start checkout process",
      });
    } finally {
      setLoading(null);
    }
  };

  const plans = [
    {
      id: 'gold',
      name: 'Gold',
      price: '$4.79',
      period: '/ 30 Days',
      originalPrice: '$4.99',
      description: 'Perfect for growing Discord servers',
      icon: Star,
      color: 'from-yellow-400 to-yellow-600',
      features: [
        '4% Loyalty Discount!',
        'Gold bot accent',
        'Sorted After Platinum Servers and Above Standard Servers on the List',
        'Can choose up to 2 vanity URLs',
        '1.5 bump point per bump window',
        'Have up to 12 team members',
        'Premium rank on support server',
        'Youtube Trailer on Bot Page',
        'Links in bot posts'
      ]
    },
    {
      id: 'platinum',
      name: 'Platinum',
      price: '$9.59',
      period: '/ 30 Days',
      originalPrice: '$9.99',
      description: 'Premium features for serious communities',
      icon: Crown,
      color: 'from-slate-400 to-slate-600',
      popular: true,
      features: [
        '4% Loyalty Discount!',
        'White bot accent',
        'Sorted First and Above Gold and Standard Servers on the List',
        'Can choose up to 3 vanity URLs',
        '2 bump point per bump window',
        'Have up to 15 team members',
        'Premium rank on support server',
        'Youtube Trailer on Bot Page',
        'Links in bot posts',
        'Randomly Selected for Large Banner Boxes',
        'Display up to 30 Days of bot statistics'
      ]
    }
  ];

  const getCurrentPlan = () => {
    if (!subscription.subscribed) return null;
    const tier = subscription.subscription_tier;
    return plans.find(plan => plan.id === tier);
  };

  const currentPlan = getCurrentPlan();

  return (
    <ModernLayout>
      <Navbar />
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your <span className="bg-gradient-to-r from-yellow-400 to-purple-600 bg-clip-text text-transparent">Premium Plan</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Boost your Discord server with premium features and get ahead of the competition
          </p>
        </div>

        {/* Current Subscription Status */}
        {currentPlan && (
          <div className="mb-8 text-center">
            <Card className="bg-slate-800/50 border-slate-700 max-w-md mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <currentPlan.icon className="h-5 w-5 text-yellow-400" />
                  <span className="text-white font-semibold">Current Plan: {currentPlan.name}</span>
                </div>
                <p className="text-slate-400 text-sm">
                  {subscription.subscription_end && 
                    `Renews on ${new Date(subscription.subscription_end).toLocaleDateString()}`
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const PlanIcon = plan.icon;
            const isCurrentPlan = currentPlan?.id === plan.id;
            
            return (
              <Card key={plan.id} className={`relative bg-slate-800/90 border-2 backdrop-blur-xl ${
                plan.popular ? 'border-purple-500 scale-105' : 'border-slate-700'
              } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''} transition-all duration-300 hover:scale-[1.02]`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-green-600 text-white">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${plan.color} flex items-center justify-center shadow-lg`}>
                    <PlanIcon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-slate-400 mb-4">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-slate-400">{plan.period}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-slate-500 line-through">Was {plan.originalPrice}</span>
                      <Badge variant="secondary" className="bg-green-900 text-green-200">
                        <Star className="h-3 w-3 mr-1" />
                        4% Loyalty Discount!
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Features List */}
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-slate-300 text-sm leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Subscribe Button */}
                  <Button
                    onClick={() => handleSubscribe(plan.id as 'gold' | 'platinum')}
                    disabled={loading === plan.id || isCurrentPlan}
                    className={`w-full h-12 text-lg font-semibold shadow-lg transition-all duration-300 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                        : 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800'
                    }`}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      'Buy Now'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <Card className="bg-slate-800/50 border-slate-700 max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Need help choosing?
              </h3>
              <p className="text-slate-400 mb-4">
                Contact our support team to find the perfect plan for your Discord server
              </p>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </ModernLayout>
  );
};

export default Pricing;