
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Shield, Zap, Target, BarChart, Crown } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "Discord Bot Integration",
      description: "Connect your servers and bots directly through Discord OAuth. Seamless integration in minutes."
    },
    {
      icon: Zap,
      title: "Network Promotion",
      description: "Bump your listings across our network of Discord servers with our dedicated promotion bot."
    },
    {
      icon: Target,
      title: "Targeted Advertising",
      description: "Reach your ideal audience with category-based targeting and smart promotion algorithms."
    },
    {
      icon: BarChart,
      title: "Analytics Dashboard",
      description: "Track your server growth, bump performance, and member acquisition with detailed analytics."
    },
    {
      icon: Shield,
      title: "Verified Listings",
      description: "Build trust with verified server badges and anti-spam protection for quality assurance."
    },
    {
      icon: Crown,
      title: "Premium Features",
      description: "Unlock advanced promotion tools, priority support, and enhanced visibility with Premium."
    }
  ];

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#36393F]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Powerful Features for Discord Growth
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to grow your Discord community and get discovered by new members.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-[#2C2F33] border-[#40444B] hover:border-[#5865F2] transition-colors duration-300">
              <CardHeader>
                <feature.icon className="h-12 w-12 text-[#5865F2] mb-4" />
                <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
