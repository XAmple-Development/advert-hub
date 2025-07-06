import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Shield, Home, Menu, X, Bot, Crown, Sparkles, BarChart3, User, Trophy, Activity, Flag, Calendar, MessageCircle, Code, ChevronDown, Search, Users, Settings, Gamepad2 } from 'lucide-react';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out.",
      });
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900/95 via-slate-900/95 to-gray-900/95 backdrop-blur-xl border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="hidden md:grid md:grid-cols-3 md:items-center md:gap-8">
          {/* Left Side Navigation */}
          <div className="flex items-center space-x-4">
            {/* Browse Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium px-6 py-2 rounded-xl transition-all duration-300">
                  <Search className="h-5 w-5 mr-2" />
                  Browse
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700 rounded-xl p-2 shadow-2xl">
                <DropdownMenuItem className="focus:bg-gray-700 rounded-lg">
                  <Link to="/listings" className="flex items-center w-full text-gray-300 hover:text-white">
                    <Users className="h-4 w-4 mr-2" />
                    Discord Servers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-gray-700 rounded-lg">
                  <Link to="/bots" className="flex items-center w-full text-gray-300 hover:text-white">
                    <Bot className="h-4 w-4 mr-2" />
                    Discord Bots
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Community Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium px-6 py-2 rounded-xl transition-all duration-300">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Community
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700 rounded-xl p-2 shadow-2xl">
                <DropdownMenuItem className="focus:bg-gray-700 rounded-lg">
                  <Link to="/forum" className="flex items-center w-full text-gray-300 hover:text-white">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Forum
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-gray-700 rounded-lg">
                  <Link to="/events" className="flex items-center w-full text-gray-300 hover:text-white">
                    <Calendar className="h-4 w-4 mr-2" />
                    Events
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-gray-700 rounded-lg">
                  <Link to="/live-activity" className="flex items-center w-full text-gray-300 hover:text-white">
                    <Activity className="h-4 w-4 mr-2" />
                    Live Activity
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-gray-700 rounded-lg">
                  <Link to="/gamification" className="flex items-center w-full text-gray-300 hover:text-white">
                    <Gamepad2 className="h-4 w-4 mr-2" />
                    Gamification
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Center Logo */}
          <div className="flex justify-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <span className="text-white text-2xl font-black group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                AdvertHub
              </span>
            </Link>
          </div>

          {/* Right Side Navigation */}
          <div className="flex items-center justify-end space-x-4">
            {user ? (
              <>
                <Link to="/">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium px-6 py-2 rounded-xl transition-all duration-300">
                    <Home className="h-5 w-5 mr-2" />
                    Dashboard
                  </Button>
                </Link>

                <Link to="/analytics">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium px-6 py-2 rounded-xl transition-all duration-300">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Analytics
                  </Button>
                </Link>

                {/* More Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium px-6 py-2 rounded-xl transition-all duration-300">
                      <User className="h-5 w-5 mr-2" />
                      More
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700 rounded-xl p-2 shadow-2xl">
                    <DropdownMenuItem className="focus:bg-gray-700 rounded-lg">
                      <Link to={`/profile/${user.id}`} className="flex items-center w-full text-gray-300 hover:text-white">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-gray-700 rounded-lg">
                      <Link to="/pricing" className="flex items-center w-full text-gray-300 hover:text-white">
                        <Crown className="h-4 w-4 mr-2" />
                        Pricing
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-gray-700 rounded-lg">
                      <Link to="/api" className="flex items-center w-full text-gray-300 hover:text-white">
                        <Code className="h-4 w-4 mr-2" />
                        API Docs
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-gray-700 rounded-lg">
                      <a href="https://status.x-ampledevelopment.co.uk/" className="flex items-center w-full text-gray-300 hover:text-white" target="_blank" rel="noopener noreferrer">
                        <Trophy className="h-4 w-4 mr-2" />
                        Live Status
                      </a>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem className="focus:bg-gray-700 rounded-lg">
                        <Link to="/moderation" className="flex items-center w-full text-gray-300 hover:text-white">
                          <Flag className="h-4 w-4 mr-2" />
                          Moderation
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {isAdmin && (
                  <Link to="/admin">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-6 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                      <Shield className="h-5 w-5 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-2 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 font-medium px-6 py-2 rounded-xl transition-all duration-300"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/25">
                  <Crown className="h-5 w-5 mr-2" />
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group" onClick={closeMobileMenu}>
            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-2xl font-black group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
              AdvertHub
            </span>
          </Link>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:bg-gray-800/50 rounded-xl"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-6 pb-6 border-t border-gray-700/50 pt-6">
            <div className="flex flex-col space-y-4">
              <Link to="/listings" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                  <Users className="h-5 w-5 mr-3" />
                  Discord Servers
                </Button>
              </Link>
              
              <Link to="/bots" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                  <Bot className="h-5 w-5 mr-3" />
                  Discord Bots
                </Button>
              </Link>
              
              <Link to="/forum" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                  <MessageCircle className="h-5 w-5 mr-3" />
                  Forum
                </Button>
              </Link>

              <Link to="/events" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                  <Calendar className="h-5 w-5 mr-3" />
                  Events
                </Button>
              </Link>

              <Link to="/live-activity" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                  <Activity className="h-5 w-5 mr-3" />
                  Live Activity
                </Button>
              </Link>

              <Link to="/gamification" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                  <Gamepad2 className="h-5 w-5 mr-3" />
                  Gamification
                </Button>
              </Link>

              {user ? (
                <>
                  <Link to="/" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                      <Home className="h-5 w-5 mr-3" />
                      Dashboard
                    </Button>
                  </Link>

                  <Link to="/analytics" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                      <BarChart3 className="h-5 w-5 mr-3" />
                      Analytics
                    </Button>
                  </Link>

                  <Link to={`/profile/${user.id}`} onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                      <User className="h-5 w-5 mr-3" />
                      Profile
                    </Button>
                  </Link>

                  <Link to="/pricing" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                      <Crown className="h-5 w-5 mr-3" />
                      Pricing
                    </Button>
                  </Link>

                  <Link to="/api" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                      <Code className="h-5 w-5 mr-3" />
                      API Docs
                    </Button>
                  </Link>

                  <a href="https://status.x-ampledevelopment.co.uk/" onClick={closeMobileMenu} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                      <Trophy className="h-5 w-5 mr-3" />
                      Live Status
                    </Button>
                  </a>

                  {isAdmin && (
                    <>
                      <Link to="/admin" onClick={closeMobileMenu}>
                        <Button className="w-full justify-start bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl">
                          <Shield className="h-5 w-5 mr-3" />
                          Admin Panel
                        </Button>
                      </Link>
                      
                      <Link to="/moderation" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                          <Flag className="h-5 w-5 mr-3" />
                          Moderation
                        </Button>
                      </Link>
                    </>
                  )}
                  
                  <Button
                    onClick={() => {
                      handleSignOut();
                      closeMobileMenu();
                    }}
                    variant="outline"
                    className="w-full justify-start border-2 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 font-medium py-3 rounded-xl"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={closeMobileMenu}>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 text-lg rounded-2xl shadow-2xl">
                    <Crown className="h-5 w-5 mr-3" />
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
