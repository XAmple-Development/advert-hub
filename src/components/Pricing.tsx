
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star, Crown, Zap, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const { user } = useAuth();
  const { subscription_tier, createCheckout, openCustomerPortal, checkSubscription, loading, isPremium, isGold, isPlatinum } = useSubscription();

  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for getting started",
      features: [
        "List up to 3 servers/bots",
        "Basic bump every 6 hours",
        "Community support",
        "Basic analytics dashboard",
        "Discord OAuth integration",
        "Standard listing visibility"
      ],
      buttonText: user ? (subscription_tier === 'free' ? "Current Plan" : "Manage Plan") : "Start Free",
      buttonVariant: "outline" as const,
      popular: false,
      gradient: "from-gray-600 to-gray-700",
      bgGradient: "from-gray-600/10 to-gray-700/10",
      icon: Zap,
      current: subscription_tier === 'free'
    },
    {
      name: "Gold",
      price: "$4.79",
      period: "/month",
      description: "Boost your server visibility",
      features: [
        "4% Loyalty Discount!",
        "Gold bot accent",
        "Higher listing priority",
        "Up to 2 vanity URLs",
        "1.5x bump power",
        "Up to 12 team members",
        "Premium rank on support server",
        "YouTube trailer on bot page",
        "Links in bot posts"
      ],
      buttonText: user ? (isGold ? "Current Plan" : "Upgrade to Gold") : "Go Gold",
      buttonVariant: "outline" as const,
      popular: false,
      gradient: "from-yellow-500 to-yellow-600",
      bgGradient: "from-yellow-500/10 to-yellow-600/10",
      icon: Star,
      current: isGold
    },
    {
      name: "Platinum",
      price: "$9.59",
      period: "/month",
      description: "Premium features for serious communities",
      features: [
        "4% Loyalty Discount!",
        "White bot accent",
        "Top listing priority",
        "Up to 3 vanity URLs",
        "2x bump power",
        "Up to 15 team members",
        "Premium rank on support server",
        "YouTube trailer on bot page",
        "Links in bot posts",
        "Large banner placement",
        "30-day bot statistics"
      ],
      buttonText: user ? (isPlatinum ? "Current Plan" : "Upgrade to Platinum") : "Go Platinum",
      buttonVariant: "default" as const,
      popular: true,
      gradient: "from-slate-400 to-slate-600",
      bgGradient: "from-slate-400/10 to-slate-600/10",
      icon: Crown,
      current: isPlatinum
    }
  ];

  const handlePlanAction = async (plan: typeof plans[0]) => {
    console.log('Plan action clicked:', plan.name, { hasUser: !!user, isPremium });
    
    if (!user) {
      console.log('User not authenticated, ignoring click');
      return;
    }

    if (plan.name === "Gold" && !isGold) {
      console.log('Upgrading to gold');
      await createCheckout();
    } else if (plan.name === "Platinum" && !isPlatinum) {
      console.log('Upgrading to platinum');
      await createCheckout();
    } else if (isPremium && (plan.name === "Gold" || plan.name === "Platinum")) {
      console.log('Opening customer portal');
      await openCustomerPortal();
    } else if (plan.name === "Starter" && isPremium) {
      console.log('Opening customer portal for downgrade');
      await openCustomerPortal();
    }
  };

  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-8 backdrop-blur-sm">
            <Crown className="h-4 w-4 text-purple-300" />
            <span className="text-purple-200 font-medium">Flexible Pricing</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Simple, 
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              {" "}Transparent Pricing
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Choose the perfect plan for your Discord empire. Scale your community with confidence 
            and unlock premium growth features that deliver real results.
          </p>
          
          {user && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="text-gray-300">
                Current Plan: <span className="font-bold text-white">{subscription_tier === 'platinum' ? 'Platinum' : subscription_tier === 'gold' ? 'Gold' : 'Free'}</span>
              </div>
              <Button
                onClick={checkSubscription}
                variant="ghost"
                size="sm"
                disabled={loading}
                className="text-purple-300 hover:text-purple-200"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border transition-all duration-500 transform hover:scale-105 hover:-translate-y-4 rounded-3xl overflow-hidden ${
                plan.popular 
                  ? 'border-purple-500/50 ring-2 ring-purple-500/30 hover:ring-purple-400/50' 
                  : 'border-gray-700/50 hover:border-purple-500/30'
              } ${plan.current ? 'ring-2 ring-green-500/50 border-green-500/50' : ''}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {plan.popular && (
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl text-sm font-bold flex items-center shadow-2xl">
                    <Star className="h-4 w-4 mr-2" />
                    Most Popular Choice
                  </div>
                </div>
              )}

              {plan.current && (
                <div className="absolute -top-6 right-4 z-20">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-2xl text-sm font-bold flex items-center shadow-2xl">
                    <Check className="h-4 w-4 mr-2" />
                    Active
                  </div>
                </div>
              )}
              
              <CardHeader className="relative z-10 text-center pb-8 pt-12">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${plan.gradient} rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <plan.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-black text-white mb-4">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  {plan.period && <span className="text-gray-400 text-2xl font-medium">{plan.period}</span>}
                </div>
                <p className="text-gray-300 text-lg">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="relative z-10 space-y-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start group/item">
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-4 mt-0.5 group-hover/item:scale-110 transition-transform duration-200">
                        <Check className="h-3 w-3 text-white font-bold" />
                      </div>
                      <span className="text-gray-300 text-lg leading-relaxed group-hover:text-gray-200 transition-colors">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                
                {user ? (
                  <Button 
                    onClick={() => handlePlanAction(plan)}
                    disabled={loading || (plan.current && plan.name === "Starter")}
                    className={`w-full py-6 text-xl font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl ${
                      plan.current && plan.name === "Starter"
                        ? 'bg-gray-600 hover:bg-gray-600 text-gray-300 cursor-not-allowed'
                        : plan.buttonVariant === 'default' 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-purple-500/25' 
                          : 'border-2 border-purple-500/50 text-purple-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:border-transparent backdrop-blur-sm'
                    }`}
                    variant={plan.current && plan.name === "Starter" ? "secondary" : plan.buttonVariant}
                  >
                    <span className="flex items-center justify-center">
                      {plan.buttonText}
                      <Sparkles className="ml-2 h-5 w-5" />
                    </span>
                  </Button>
                ) : (
                  <Link to="/auth" className="block">
                    <Button 
                      className={`w-full py-6 text-xl font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl ${
                        plan.buttonVariant === 'default' 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-purple-500/25' 
                          : 'border-2 border-purple-500/50 text-purple-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:border-transparent backdrop-blur-sm'
                      }`}
                      variant={plan.buttonVariant}
                    >
                      <span className="flex items-center justify-center">
                        {plan.buttonText}
                        <Sparkles className="ml-2 h-5 w-5" />
                      </span>
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="text-center mt-16">
          <p className="text-gray-400 mb-4">Trusted by thousands of Discord communities worldwide</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-2xl font-bold text-gray-500">1M+ Servers</div>
            <div className="w-px h-8 bg-gray-600"></div>
            <div className="text-2xl font-bold text-gray-500">50M+ Members</div>
            <div className="w-px h-8 bg-gray-600"></div>
            <div className="text-2xl font-bold text-gray-500">24/7 Support</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
