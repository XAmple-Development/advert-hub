
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Bot, Megaphone, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      step: 1,
      icon: UserPlus,
      title: "Connect & Authenticate",
      description: "Securely link your Discord servers using our premium OAuth integration. Setup takes less than 60 seconds with guided onboarding.",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/10 to-pink-500/10"
    },
    {
      step: 2,
      icon: Bot,
      title: "Create Premium Listings",
      description: "Design compelling server profiles with rich media, detailed descriptions, and strategic categorization to attract your ideal community.",
      gradient: "from-cyan-500 to-blue-500",
      bgGradient: "from-cyan-500/10 to-blue-500/10"
    },
    {
      step: 3,
      icon: Megaphone,
      title: "AI-Powered Promotion",
      description: "Our intelligent bot network automatically promotes your server across thousands of targeted Discord communities with optimal timing.",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/10 to-emerald-500/10"
    },
    {
      step: 4,
      icon: TrendingUp,
      title: "Explosive Growth",
      description: "Watch your community explode with targeted members as our advanced analytics track performance and optimize your growth strategy.",
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-500/10 to-red-500/10"
    }
  ];

  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full mb-8 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            <span className="text-cyan-200 font-medium">Simple Process</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            How It 
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              {" "}Works
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Transform your Discord server into a thriving community in just four simple steps. 
            Our streamlined process gets you growing in minutes, not hours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-1/2 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent transform -translate-y-1/2 z-0"></div>
          
          {steps.map((stepItem, index) => (
            <div key={index} className="relative">
              <Card className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105 hover:-translate-y-4 rounded-3xl overflow-hidden h-full">
                <div className={`absolute inset-0 bg-gradient-to-br ${stepItem.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                {/* Step Number Badge */}
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-20">
                  <div className={`bg-gradient-to-r ${stepItem.gradient} text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                    {stepItem.step}
                  </div>
                </div>

                <CardHeader className="relative z-10 pt-12 pb-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${stepItem.gradient} rounded-2xl mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                    <stepItem.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-white text-2xl font-bold text-center group-hover:text-white transition-colors">
                    {stepItem.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="relative z-10">
                  <p className="text-gray-300 text-center leading-relaxed group-hover:text-gray-200 transition-colors">
                    {stepItem.description}
                  </p>
                </CardContent>

                {/* Arrow for larger screens */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
