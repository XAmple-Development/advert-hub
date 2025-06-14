
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-[#2C2F33] border-b border-[#23272A] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-[#5865F2]" />
            <span className="text-white text-xl font-bold">DiscordBoost</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How it Works</a>
            <Link to="/auth">
              <Button variant="outline" className="border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white">
                Login
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-[#5865F2] hover:bg-[#4752C4] text-white">
                Get Started
              </Button>
            </Link>
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-[#23272A] rounded-lg mt-2 p-4 space-y-4">
            <a href="#features" className="block text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="block text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#how-it-works" className="block text-gray-300 hover:text-white transition-colors">How it Works</a>
            <div className="space-y-2 pt-4 border-t border-gray-600">
              <Link to="/auth" className="block">
                <Button variant="outline" className="w-full border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white">
                  Login
                </Button>
              </Link>
              <Link to="/auth" className="block">
                <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
