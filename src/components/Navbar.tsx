import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Shield, Home, Menu, X, Bot, Crown, Sparkles, BarChart3, User, Trophy, Activity, Flag } from 'lucide-react';

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
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group" onClick={closeMobileMenu}>
            <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-2xl font-black group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
              AdvertHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/listings">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium px-6 py-2 rounded-xl transition-all duration-300">
                Browse Servers
              </Button>
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
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

                <Link to="/gamification">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium px-6 py-2 rounded-xl transition-all duration-300">
                    <Trophy className="h-5 w-5 mr-2" />
                    Rewards
                  </Button>
                </Link>

                <Link to="/activity">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium px-6 py-2 rounded-xl transition-all duration-300">
                    <Activity className="h-5 w-5 mr-2" />
                    Activity
                  </Button>
                </Link>

                <Link to={`/profile/${user.id}`}>
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium px-6 py-2 rounded-xl transition-all duration-300">
                    <User className="h-5 w-5 mr-2" />
                    Profile
                  </Button>
                </Link>

                {isAdmin && (
                  <>
                    <Link to="/admin">
                      <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-6 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg">
                        <Shield className="h-5 w-5 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  </>
                )}
                
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-2 border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 font-medium px-6 py-2 rounded-xl transition-all duration-300"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 text-lg rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/25">
                  <Crown className="h-5 w-5 mr-2" />
                  Get Started
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:bg-gray-800/50 rounded-xl"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-6 pb-6 border-t border-gray-700/50 pt-6">
            <div className="flex flex-col space-y-4">
              <Link to="/listings" onClick={closeMobileMenu}>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                  Browse Servers
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

                  <Link to="/gamification" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                      <Trophy className="h-5 w-5 mr-3" />
                      Rewards
                    </Button>
                  </Link>

                  <Link to="/activity" onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                      <Activity className="h-5 w-5 mr-3" />
                      Activity
                    </Button>
                  </Link>

                  <Link to={`/profile/${user.id}`} onClick={closeMobileMenu}>
                    <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 text-lg font-medium py-3 rounded-xl">
                      <User className="h-5 w-5 mr-3" />
                      Profile
                    </Button>
                  </Link>

                  {isAdmin && (
                    <>
                      <Link to="/admin" onClick={closeMobileMenu}>
                        <Button className="w-full justify-start bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 rounded-xl">
                          <Shield className="h-5 w-5 mr-3" />
                          Admin Panel
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
