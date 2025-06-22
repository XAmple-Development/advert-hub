
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { LogOut, Shield, Home, Menu, X } from 'lucide-react';

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
    <nav className="bg-[#36393F] border-b border-[#40444B] px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-white text-xl font-bold" onClick={closeMobileMenu}>
          Discord Directory
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/listings">
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              Browse
            </Button>
          </Link>

          {user ? (
            <>
              <Link to="/">
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>

              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" className="border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button className="bg-[#5865F2] hover:bg-[#4752C4]">
                Sign In
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
            className="text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-[#40444B]">
          <div className="flex flex-col space-y-2 pt-4">
            <Link to="/listings" onClick={closeMobileMenu}>
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white">
                Browse
              </Button>
            </Link>

            {user ? (
              <>
                <Link to="/" onClick={closeMobileMenu}>
                  <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white">
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </Link>

                {isAdmin && (
                  <Link to="/admin" onClick={closeMobileMenu}>
                    <Button variant="outline" className="w-full justify-start border-[#5865F2] text-[#5865F2] hover:bg-[#5865F2] hover:text-white">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                
                <Button
                  onClick={() => {
                    handleSignOut();
                    closeMobileMenu();
                  }}
                  variant="outline"
                  className="w-full justify-start border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth" onClick={closeMobileMenu}>
                <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4]">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
