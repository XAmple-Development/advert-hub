
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbName = (path: string, index: number) => {
    switch (path) {
      case 'listings': return 'Browse Servers';
      case 'admin': return 'Admin Panel';
      case 'auth': return 'Authentication';
      default:
        // For dynamic routes like listing IDs, show a generic name
        if (pathnames[index - 1] === 'listings') return 'Server Details';
        return path.charAt(0).toUpperCase() + path.slice(1);
    }
  };

  if (pathnames.length === 0) return null;

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/" className="flex items-center text-gray-300 hover:text-white">
                  <Home className="h-4 w-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {pathnames.map((path, index) => {
              const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
              const isLast = index === pathnames.length - 1;
              
              return (
                <div key={path} className="flex items-center">
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="text-white font-medium">
                        {getBreadcrumbName(path, index)}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={routeTo} className="text-gray-300 hover:text-white">
                          {getBreadcrumbName(path, index)}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};

export default Breadcrumbs;
