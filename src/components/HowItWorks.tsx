
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Bot, Megaphone, TrendingUp } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      step: 1,
      icon: UserPlus,
      title: "Sign Up & Connect",
      description: "Create your account and connect your Discord servers or bots using our secure OAuth integration."
    },
    {
      step: 2,
      icon: Bot,
      title: "Create Your Listing",
      description: "Add your server details, categories, and compelling descriptions to attract the right audience."
    },
    {
      step: 3,
      icon: Megaphone,
      title: "Bump & Promote",
      description: "Use our network bot to advertise your server across thousands of Discord communities."
    },
    {
      step: 4,
      icon: TrendingUp,
      title: "Grow Your Community",
      description: "Watch your member count grow as our promotion network drives targeted traffic to your server."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#36393F]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Get your Discord server or bot discovered in just four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((stepItem, index) => (
            <Card key={index} className="bg-[#2C2F33] border-[#40444B] text-center relative">
              <CardHeader>
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#5865F2] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                    {stepItem.step}
                  </div>
                </div>
                <stepItem.icon className="h-12 w-12 text-[#5865F2] mx-auto mb-4 mt-4" />
                <CardTitle className="text-white text-xl">{stepItem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">{stepItem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
