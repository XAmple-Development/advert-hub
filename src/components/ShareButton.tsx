
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
}

const ShareButton = ({ url, title, description }: ShareButtonProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied",
      description: "The link has been copied to your clipboard",
    });
    setIsOpen(false);
  };

  const shareNatively = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      copyToClipboard();
    }
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white rounded-xl"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 border-gray-700">
        <DropdownMenuItem onClick={copyToClipboard} className="text-gray-300 hover:bg-gray-700">
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
        {navigator.share && (
          <DropdownMenuItem onClick={shareNatively} className="text-gray-300 hover:bg-gray-700">
            <ExternalLink className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
