
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-9xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            404
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-gray-300 text-lg mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-6 py-3 rounded-xl">
                <Home className="h-5 w-5 mr-2" />
                Go Home
              </Button>
            </Link>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-6 py-3 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
