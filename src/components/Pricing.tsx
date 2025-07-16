
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
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-full mb-6 backdrop-blur-sm">
            <Crown className="h-4 w-4 text-purple-400" />
            <span className="text-purple-300 font-medium text-sm">Premium Plans</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Choose Your 
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              {" "}Perfect Plan
            </span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Unlock powerful features to grow your Discord community faster than ever
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`group relative backdrop-blur-xl border transition-all duration-300 transform hover:scale-105 rounded-xl overflow-hidden ${
                plan.popular 
                  ? 'border-purple-500/50 ring-1 ring-purple-500/20 bg-gradient-to-br from-purple-900/20 to-pink-900/20' 
                  : plan.current
                    ? 'border-green-500/50 ring-1 ring-green-500/20 bg-gradient-to-br from-green-900/20 to-emerald-900/20'
                    : 'border-gray-700/50 hover:border-purple-500/30 bg-gradient-to-br from-gray-800/50 to-gray-900/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </div>
                </div>
              )}

              {plan.current && (
                <div className="absolute -top-3 right-3 z-20">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                    <Check className="h-3 w-3 mr-1" />
                    Current
                  </div>
                </div>
              )}
              
              <CardHeader className="relative z-10 text-center pb-4 pt-8">
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${plan.gradient} rounded-xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <plan.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white mb-2">{plan.name}</CardTitle>
                <div className="mb-3">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  {plan.period && <span className="text-gray-400 text-lg">{plan.period}</span>}
                </div>
                <p className="text-gray-300 text-sm">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="relative z-10 px-6 pb-6">
                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 5).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-sm">
                      <div className="flex-shrink-0 w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <Check className="h-2 w-2 text-white font-bold" />
                      </div>
                      <span className="text-gray-300 leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-xs text-gray-400 pl-7">
                      +{plan.features.length - 5} more features
                    </li>
                  )}
                </ul>
                
                {user ? (
                  <Button 
                    onClick={() => handlePlanAction(plan)}
                    disabled={loading || (plan.current && plan.name === "Starter")}
                    className={`w-full py-3 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 ${
                      plan.current && plan.name === "Starter"
                        ? 'bg-gray-600 hover:bg-gray-600 text-gray-300 cursor-not-allowed'
                        : plan.buttonVariant === 'default' 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg' 
                          : 'border-2 border-purple-500/50 text-purple-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:border-transparent backdrop-blur-sm'
                    }`}
                    variant={plan.current && plan.name === "Starter" ? "secondary" : plan.buttonVariant}
                  >
                    {plan.buttonText}
                  </Button>
                ) : (
                  <Link to="/auth" className="block">
                    <Button 
                      className={`w-full py-3 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 ${
                        plan.buttonVariant === 'default' 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg' 
                          : 'border-2 border-purple-500/50 text-purple-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-pink-600 hover:text-white hover:border-transparent backdrop-blur-sm'
                      }`}
                      variant={plan.buttonVariant}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4 text-sm">Need help choosing the right plan?</p>
          <Button 
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:bg-gray-700/50 backdrop-blur-sm"
            onClick={() => window.open('https://discord.gg/3mNGT2AwNy', '_blank')}
          >
            Contact Support
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
