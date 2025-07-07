
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Users, TrendingUp, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-blue-400 rounded-full opacity-60 animate-bounce"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-purple-400 rounded-full opacity-60 animate-bounce delay-300"></div>
        <div className="absolute bottom-40 left-20 w-5 h-5 bg-pink-400 rounded-full opacity-60 animate-bounce delay-700"></div>
        <div className="absolute bottom-20 right-10 w-4 h-4 bg-cyan-400 rounded-full opacity-60 animate-bounce delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20 flex items-center min-h-screen">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-12">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-8 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-purple-300" />
              <span className="text-purple-200 font-medium">Premium Discord Growth Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 md:mb-8 leading-tight">
              Boost Your 
              <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                Discord Empire
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
              Connect your Discord server or bot to our premium advertising network. 
              <span className="text-cyan-300 font-semibold"> Get discovered by millions</span> and 
              <span className="text-purple-300 font-semibold"> grow exponentially</span> with our AI-powered promotion system.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center mb-12 md:mb-16 px-4">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="group relative w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white px-8 md:px-12 py-4 md:py-6 text-lg md:text-xl font-bold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 border-0">
                  <span className="flex items-center justify-center">
                    Start Growing Now
                    <ArrowRight className="ml-2 md:ml-3 h-5 md:h-6 w-5 md:w-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity -z-10"></div>
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-gray-400/50 text-white hover:bg-white/10 hover:border-white/50 px-8 md:px-12 py-4 md:py-6 text-lg md:text-xl font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300 transform hover:scale-105">
                Watch Demo
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">1k+ Servers</h3>
                <p className="text-gray-300 text-lg">Connected to our massive network</p>
              </div>
            </div>
            
            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">AI-Powered Bumps</h3>
                <p className="text-gray-300 text-lg">Smart promotion across our bot network</p>
              </div>
            </div>
            
            <div className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl mb-6">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">5k+ Views</h3>
                <p className="text-gray-300 text-lg">Monthly advertisement impressions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
