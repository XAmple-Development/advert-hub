
import { Bot, Heart, Star, Crown, Zap } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl">
                  <Bot className="h-8 w-8 text-white" />
                </div>
                <span className="text-white text-3xl font-black">AdvertHub</span>
              </div>
              <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-md">
                The ultimate platform for Discord server and bot promotion. Join thousands of communities 
                growing their audience through our premium network.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4">
                <div className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full backdrop-blur-sm">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span className="text-white font-medium text-sm md:text-base">4.9/5 Rating</span>
                </div>
                <div className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full backdrop-blur-sm">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span className="text-white font-medium text-sm md:text-base">1M+ Happy Users</span>
                </div>
              </div>
            </div>
            
            {/* Platform Links */}
            <div className="space-y-6">
              <h3 className="text-white font-bold text-xl flex items-center">
                <Crown className="h-5 w-5 mr-2 text-purple-400" />
                Platform
              </h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-purple-300 transition-colors text-lg hover:translate-x-1 transform duration-200 inline-block">Features</a></li>
                <li><a href="/pricing" className="text-gray-400 hover:text-purple-300 transition-colors text-lg hover:translate-x-1 transform duration-200 inline-block">Pricing</a></li>
                <li><a href="#how-it-works" className="text-gray-400 hover:text-purple-300 transition-colors text-lg hover:translate-x-1 transform duration-200 inline-block">How it Works</a></li>
                <li><a href="#" className="text-gray-400 hover:text-purple-300 transition-colors text-lg hover:translate-x-1 transform duration-200 inline-block">Analytics</a></li>
              </ul>
            </div>
            
            {/* Support Links */}
            <div className="space-y-6">
              <h3 className="text-white font-bold text-xl flex items-center">
                <Zap className="h-5 w-5 mr-2 text-cyan-400" />
                Support
              </h3>
              <ul className="space-y-3">
                <li><a href="https://discord.gg/3mNGT2AwNy" className="text-gray-400 hover:text-cyan-300 transition-colors text-lg hover:translate-x-1 transform duration-200 inline-block">Help Center</a></li>
                <li><a href="https://discord.gg/3mNGT2AwNy" className="text-gray-400 hover:text-cyan-300 transition-colors text-lg hover:translate-x-1 transform duration-200 inline-block">Discord Server</a></li>
                <li><a href="https://discord.gg/3mNGT2AwNy" className="text-gray-400 hover:text-cyan-300 transition-colors text-lg hover:translate-x-1 transform duration-200 inline-block">Contact Us</a></li>
                <li><a href="https://status.x-ampledevelopment.co.uk" className="text-gray-400 hover:text-cyan-300 transition-colors text-lg hover:translate-x-1 transform duration-200 inline-block">Status</a></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-gray-700/50 pt-12 flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
              <p className="text-gray-400 text-lg">
                © 2025 AdvertHub. All rights reserved.
              </p>
              <div className="flex items-center space-x-2 text-gray-400">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-red-400 animate-pulse" />
                <span>by X-Ample Development</span>
              </div>
            </div>
            
            <div className="flex space-x-8">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-lg">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-lg">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
