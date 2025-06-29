
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Server, Bot } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-results' | 'no-listings' | 'no-data';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: 'search' | 'plus' | 'server' | 'bot';
}

const EmptyState = ({ 
  type, 
  title, 
  description, 
  actionText, 
  onAction, 
  icon = 'search' 
}: EmptyStateProps) => {
  const getIcon = () => {
    const iconClass = "h-16 w-16 text-gray-600 mx-auto mb-4";
    switch (icon) {
      case 'search': return <Search className={iconClass} />;
      case 'plus': return <Plus className={iconClass} />;
      case 'server': return <Server className={iconClass} />;
      case 'bot': return <Bot className={iconClass} />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'no-results': return 'from-orange-500/20 to-red-500/20';
      case 'no-listings': return 'from-purple-500/20 to-pink-500/20';
      case 'no-data': return 'from-gray-500/20 to-slate-500/20';
      default: return 'from-purple-500/20 to-pink-500/20';
    }
  };

  return (
    <Card className={`bg-gradient-to-r ${getGradient()} backdrop-blur-xl border border-gray-700/50 rounded-3xl`}>
      <CardContent className="py-16 px-8">
        <div className="text-center max-w-md mx-auto">
          {getIcon()}
          <h3 className="text-2xl font-bold text-white mb-3">
            {title}
          </h3>
          <p className="text-gray-300 text-lg mb-6">
            {description}
          </p>
          {actionText && onAction && (
            <Button
              onClick={onAction}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-2xl transform hover:scale-105 transition-all duration-200"
            >
              {actionText}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
