
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const KeyboardShortcuts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K for search (navigate to listings)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        navigate('/listings');
        toast({
          title: "Quick Navigation",
          description: "Navigated to Browse Servers",
        });
      }

      // Ctrl/Cmd + H for home
      if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
        event.preventDefault();
        navigate('/');
        toast({
          title: "Quick Navigation",
          description: "Navigated to Home",
        });
      }

      // ESC to go back
      if (event.key === 'Escape' && window.history.length > 1) {
        event.preventDefault();
        window.history.back();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, toast]);

  return null; // This component doesn't render anything
};

export default KeyboardShortcuts;
