
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const plans = [
    {
      name: "Standard",
      price: "Free",
      description: "Perfect for getting started",
      features: [
        "List up to 3 servers/bots",
        "Basic bump every 6 hours",
        "Community support",
        "Basic analytics",
        "Discord integration"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "Premium",
      price: "$9.99",
      period: "/month",
      description: "Maximize your server growth",
      features: [
        "Unlimited server/bot listings",
        "Priority bumps every 2 hours",
        "Featured listing placement",
        "Advanced analytics & insights",
        "Priority support",
        "Custom embed styling",
        "Cross-promotion network",
        "Verified server badge"
      ],
      buttonText: "Upgrade to Premium",
      buttonVariant: "default" as const,
      popular: true
    }
  ];

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#2C2F33]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the plan that fits your community's needs. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative bg-[#36393F] border-[#40444B] ${
                plan.popular ? 'border-[#5865F2] ring-2 ring-[#5865F2] ring-opacity-50' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#5865F2] text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period && <span className="text-gray-400 text-lg">{plan.period}</span>}
                </div>
                <p className="text-gray-400 mt-2">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-[#5865F2] mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link to="/auth" className="block">
                  <Button 
                    className={`w-full py-3 text-lg ${
                      plan.buttonVariant === 'default' 
                        ? 'bg-[#5865F2] hover:bg-[#4752C4] text-white' 
                        : 'border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white'
                    }`}
                    variant={plan.buttonVariant}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
