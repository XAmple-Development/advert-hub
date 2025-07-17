import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Shield, Home, Menu, X, Bot, Crown, Sparkles, BarChart3, User, Trophy, Activity, Flag, Calendar, MessageCircle, Code, ChevronDown, Search, Users, Settings, Gamepad2, MessageSquare } from 'lucide-react';
import NotificationCenter from '@/components/notifications/NotificationCenter';

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
    <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-background/80 border-b border-border shadow-elevation-sm transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="hidden md:flex md:items-center md:justify-between md:w-full">
          {/* Left Side Navigation */}
          <div className="flex items-center space-x-1">
            {/* Browse Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent/50 font-medium px-5 py-2.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5">
                  <Search className="h-4 w-4 mr-2" />
                  Browse
                  <ChevronDown className="h-3 w-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card/95 backdrop-blur-2xl border-border rounded-xl p-3 shadow-elevation-lg z-50">
                <DropdownMenuItem className="focus:bg-accent/50 rounded-lg p-3 transition-colors">
                  <Link to="/listings" className="flex items-center w-full text-foreground hover:text-primary font-medium">
                    <Users className="h-4 w-4 mr-3" />
                    Listings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Community Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent/50 font-medium px-5 py-2.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Community
                  <ChevronDown className="h-3 w-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card/95 backdrop-blur-2xl border-border rounded-xl p-3 shadow-elevation-lg z-50">
                <DropdownMenuItem className="focus:bg-accent/50 rounded-lg p-3 transition-colors">
                  <Link to="/forum" className="flex items-center w-full text-foreground hover:text-primary font-medium">
                    <MessageCircle className="h-4 w-4 mr-3" />
                    Forum
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-accent/50 rounded-lg p-3 transition-colors">
                  <Link to="/chat" className="flex items-center w-full text-foreground hover:text-primary font-medium">
                    <MessageSquare className="h-4 w-4 mr-3" />
                    AI Chat Advisor
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-accent/50 rounded-lg p-3 transition-colors">
                  <Link to="/events" className="flex items-center w-full text-foreground hover:text-primary font-medium">
                    <Calendar className="h-4 w-4 mr-3" />
                    Events
                  </Link>
                </DropdownMenuItem>
                {user && (
                  <>
                    <DropdownMenuItem className="focus:bg-accent/50 rounded-lg p-3 transition-colors">
                      <Link to="/gamification" className="flex items-center w-full text-foreground hover:text-primary font-medium">
                        <Gamepad2 className="h-4 w-4 mr-3" />
                        Gamification
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-accent/50 rounded-lg p-3 transition-colors">
                      <Link to="/" className="flex items-center w-full text-foreground hover:text-primary font-medium">
                        <Home className="h-4 w-4 mr-3" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-accent/50 rounded-lg p-3 transition-colors">
                      <Link to="/analytics" className="flex items-center w-full text-foreground hover:text-primary font-medium">
                        <BarChart3 className="h-4 w-4 mr-3" />
                        Analytics
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Center Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-elevation-md group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-110">
                  <span className="text-white font-black text-xl">D</span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              </div>
              <span className="hidden lg:block text-xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                DiscoverHub
              </span>
            </Link>
          </div>

          {/* Right Side Navigation */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <NotificationCenter />

                {/* More Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent/50 font-medium px-5 py-2.5 rounded-xl transition-all duration-300 hover:-translate-y-0.5">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                      <ChevronDown className="h-3 w-3 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card/95 backdrop-blur-2xl border-border rounded-xl p-3 shadow-elevation-lg z-50">
                    <DropdownMenuItem className="focus:bg-accent/50 rounded-lg p-3 transition-colors">
                      <Link to={`/profile/${user.id}`} className="flex items-center w-full text-foreground hover:text-primary font-medium">
                        <User className="h-4 w-4 mr-3" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-accent/50 rounded-lg p-3 transition-colors">
                      <Link to="/pricing" className="flex items-center w-full text-foreground hover:text-primary font-medium">
                        <Crown className="h-4 w-4 mr-3" />
                        Premium
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-accent/50 rounded-lg p-3 transition-colors">
                      <a href="https://status.x-ampledevelopment.co.uk/" className="flex items-center w-full text-foreground hover:text-primary font-medium" target="_blank" rel="noopener noreferrer">
                        <Activity className="h-4 w-4 mr-3" />
                        Status
                      </a>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem className="focus:bg-accent/50 rounded-lg p-3 transition-colors">
                        <Link to="/moderation" className="flex items-center w-full text-foreground hover:text-primary font-medium">
                          <Flag className="h-4 w-4 mr-3" />
                          Moderation
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="premium" size="default" className="font-semibold">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="default"
                  className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground font-medium"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="cosmic" size="default" className="font-semibold">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group" onClick={closeMobileMenu}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="text-white font-black text-lg">D</span>
            </div>
            <span className="text-foreground text-xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              DiscoverHub
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
                  Listings
                </Button>
              </Link>
              
              <Link to="/forum" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                  <MessageCircle className="h-5 w-5 mr-3" />
                  Forum
                </Button>
              </Link>

              <Link to="/chat" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                  <MessageSquare className="h-5 w-5 mr-3" />
                  AI Chat Advisor
                </Button>
              </Link>

              <Link to="/events" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                  <Calendar className="h-5 w-5 mr-3" />
                  Events
                </Button>
              </Link>

              {user && (
                <Link to="/gamification" onClick={closeMobileMenu}>
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                    <Gamepad2 className="h-5 w-5 mr-3" />
                    Gamification
                  </Button>
                </Link>
              )}

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
