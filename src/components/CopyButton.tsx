
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

const CopyButton = ({ text, label = "Copy", variant = "outline", size = "sm" }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try copying manually",
      });
    }
  };

  return (
    <Button
      onClick={copyToClipboard}
      variant={variant}
      size={size}
      className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white rounded-xl"
    >
      {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
      {copied ? 'Copied!' : label}
    </Button>
  );
};

export default CopyButton;
