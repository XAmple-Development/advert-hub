
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Crown, 
  BarChart3, 
  Shield, 
  Palette, 
  Network,
  Clock,
  Star,
  Sparkles,
  TrendingUp
} from 'lucide-react';

const PremiumFeatures = () => {
  const features = [
    {
      icon: Zap,
      title: "Priority Bumps",
      description: "Bump your listings every 2 hours instead of 6 hours",
      benefit: "3x more visibility",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: Crown,
      title: "Featured Placement",
      description: "Get your listings featured at the top of search results",
      benefit: "Premium visibility",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Detailed insights with AI-powered growth recommendations",
      benefit: "Data-driven growth",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Shield,
      title: "Verified Badge",
      description: "Stand out with a verified server badge for trust",
      benefit: "Increased credibility",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Palette,
      title: "Custom Styling",
      description: "Customize your listing appearance with themes and colors",
      benefit: "Unique branding",
      gradient: "from-red-500 to-rose-500"
    },
    {
      icon: Network,
      title: "Cross-Promotion",
      description: "Access to our premium cross-promotion network",
      benefit: "Mutual growth",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Priority customer support with dedicated assistance",
      benefit: "Always available",
      gradient: "from-teal-500 to-green-500"
    },
    {
      icon: TrendingUp,
      title: "Growth Tools",
      description: "Advanced tools for optimizing your server growth",
      benefit: "Accelerated growth",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-6 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-purple-300" />
            <span className="text-purple-200 font-medium">Premium Features</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Unlock 
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              {" "}Premium Power
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Take your Discord server to the next level with our premium features designed 
            to maximize your growth and engagement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 rounded-2xl overflow-hidden hover:transform hover:scale-105 hover:-translate-y-2"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <CardHeader className="relative z-10 text-center pb-4">
                <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl mb-4 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {feature.title}
                </CardTitle>
                <Badge 
                  variant="secondary" 
                  className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30"
                >
                  {feature.benefit}
                </Badge>
              </CardHeader>
              
              <CardContent className="relative z-10 pt-0">
                <p className="text-gray-400 text-center leading-relaxed group-hover:text-gray-300 transition-colors">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-2xl backdrop-blur-sm">
            <Star className="h-5 w-5 text-yellow-400" />
            <span className="text-white font-semibold">Join thousands of successful Discord communities</span>
            <Star className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumFeatures;
