
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Shield, Zap, Target, BarChart, Crown, Sparkles, Star } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "Discord Bot Integration",
      description: "Seamless OAuth integration with your Discord servers and bots. Setup takes less than 60 seconds with our streamlined process.",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10"
    },
    {
      icon: Zap,
      title: "Lightning Network Promotion",
      description: "Instantly promote across our massive network of Discord servers with AI-optimized timing and targeting algorithms.",
      gradient: "from-cyan-500 to-blue-500",
      bgGradient: "from-cyan-500/10 to-blue-500/10"
    },
    {
      icon: Target,
      title: "Smart Targeted Advertising",
      description: "AI-powered audience targeting based on interests, demographics, and engagement patterns for maximum conversion rates.",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/10 to-emerald-500/10"
    },
    {
      icon: BarChart,
      title: "Advanced Analytics Suite",
      description: "Real-time insights into server growth, engagement metrics, and ROI tracking with beautiful, actionable dashboards.",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-500/10 to-red-500/10"
    },
    {
      icon: Shield,
      title: "Premium Security & Trust",
      description: "Enterprise-grade security with verified server badges, anti-spam protection, and community quality assurance.",
      gradient: "from-indigo-500 to-purple-500",
      bgGradient: "from-indigo-500/10 to-purple-500/10"
    },
    {
      icon: Crown,
      title: "VIP Premium Features",
      description: "Unlock exclusive promotion tools, priority support, enhanced visibility, and advanced customization options.",
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-500/10 to-orange-500/10"
    }
  ];

  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-8 backdrop-blur-sm">
            <Star className="h-4 w-4 text-purple-300" />
            <span className="text-purple-200 font-medium">Premium Features</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 px-4">
            Powerful Features for 
            <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Discord Domination
            </span>
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
            Everything you need to transform your Discord community into a thriving empire. 
            Built for growth, designed for success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-3 rounded-3xl overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              <CardHeader className="relative z-10 pb-4 p-4 md:p-6">
                <div className={`inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                </div>
                <CardTitle className="text-white text-xl md:text-2xl font-bold group-hover:text-white transition-colors leading-tight">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="relative z-10 p-4 md:p-6 pt-0">
                <p className="text-gray-300 text-base md:text-lg leading-relaxed group-hover:text-gray-200 transition-colors">
                  {feature.description}
                </p>
              </CardContent>

              {/* Sparkle Effect */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-purple-300" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
