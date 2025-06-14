import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Users, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="bg-gradient-to-br from-[#2C2F33] via-[#36393F] to-[#2C2F33] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Boost Your Discord
            <span className="bg-gradient-to-r from-[#5865F2] to-[#7289DA] bg-clip-text text-transparent"> Community</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Connect your Discord servers and bots to our advertising network. Get discovered by thousands of users and grow your community with our premium promotion system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 text-lg">
                Start Advertising <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-gray-400 text-gray-300 hover:bg-gray-800 px-8 py-4 text-lg">
              View Demo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-[#36393F] rounded-lg p-6 border border-[#40444B]">
            <Users className="h-12 w-12 text-[#5865F2] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">50K+ Servers</h3>
            <p className="text-gray-400">Connected to our network</p>
          </div>
          <div className="bg-[#36393F] rounded-lg p-6 border border-[#40444B]">
            <Zap className="h-12 w-12 text-[#5865F2] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Instant Bumps</h3>
            <p className="text-gray-400">Promote across our bot network</p>
          </div>
          <div className="bg-[#36393F] rounded-lg p-6 border border-[#40444B]">
            <TrendingUp className="h-12 w-12 text-[#5865F2] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">2M+ Views</h3>
            <p className="text-gray-400">Monthly advertisement impressions</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
