import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Server, AlertCircle, RefreshCw, LogOut, LogIn, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

interface DiscordServer {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
  member_count: number;
  owner: boolean;
  description?: string;
}

interface Category {
  id: string;
  name: string;
}

interface DiscordImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

const DiscordImportModal = ({
  open,
  onOpenChange,
  onImportComplete,
}: DiscordImportModalProps) => {
  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<DiscordServer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    vanity_url: '',
    primary_category: '',
    secondary_category: '',
    tags: '',
    nsfw: false
  });
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPremium } = useSubscription();

  // Check if user signed in with Discord - be more flexible with detection
  const isDiscordUser = user && (
    user.app_metadata?.provider === 'discord' ||
    user.app_metadata?.providers?.includes('discord') ||
    user.identities?.some(identity => identity.provider === 'discord')
  );

  const fetchDiscordData = async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    
    try {
      console.log('Fetching Discord data...');
      
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }

      if (!session?.access_token) {
        throw new Error('No active session found. Please log in.');
      }

      console.log('Making request to discord-import function...');
      
      const { data, error } = await supabase.functions.invoke('discord-import', {
        body: { action: 'fetch' },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        
        // Parse error details if available
        let errorMessage = error.message || 'Failed to fetch Discord data';
        let errorCodeValue = 'UNKNOWN_ERROR';
        
        try {
          if (typeof error.message === 'string') {
            const parsedError = JSON.parse(error.message);
            errorMessage = parsedError.details || parsedError.error || errorMessage;
            errorCodeValue = parsedError.code || errorCodeValue;
          }
        } catch (parseError) {
          // If parsing fails, use the original error message
        }
        
        setError(errorMessage);
        setErrorCode(errorCodeValue);
        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error('No data received from Discord import function');
      }

      // Handle the response format
      setServers(data.servers || []);

      console.log('Successfully fetched Discord data:', {
        servers: (data.servers || []).length
      });

    } catch (error: any) {
      console.error('[DiscordImportModal] Error fetching Discord data:', error);
      
      if (!error.message.includes('details') && !error.message.includes('code')) {
        setError(error.message);
      }
      
      toast({
        variant: 'destructive',
        title: 'Error fetching Discord data',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
    }
  };

  useEffect(() => {
    if (open && isDiscordUser) {
      fetchDiscordData();
      fetchCategories();
    }
  }, [open, isDiscordUser]);

  // Update form data when server selection changes
  useEffect(() => {
    if (selectedServer) {
      const server = servers.find(s => s.id === selectedServer);
      if (server) {
        setFormData(prev => ({
          ...prev,
          name: server.name,
          description: server.description || `Discord server ${server.owner ? 'owned by you' : 'where you have manage permissions'}.`
        }));
      }
    }
  }, [selectedServer, servers]);

  const handleImport = async () => {
    if (!selectedServer) {
      toast({
        variant: 'destructive',
        title: 'No server selected',
        description: 'Please select a server to import.',
      });
      return;
    }

    setImporting(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('No active session found. Please log in.');
      }

      const { data, error } = await supabase.functions.invoke('discord-import', {
        body: {
          action: 'import',
          servers: [selectedServer],
          formData: formData
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw new Error(error.message);

      toast({
        title: 'Import Successful!',
        description: 'Your Discord server has been imported successfully.',
      });

      onImportComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('[DiscordImportModal] Error importing Discord data:', error);
      
      // Check if it's a subscription limit error with new error codes
      if (error.message.includes('PREMIUM_UPGRADE_REQUIRED') || 
          error.message.includes('SUBSCRIPTION_LIMIT_EXCEEDED') ||
          error.message.includes('Listing limit exceeded')) {
        toast({
          variant: 'destructive',
          title: 'Premium Upgrade Required',
          description: 'Free users can create up to 3 listings. Upgrade to Premium for unlimited listings and enhanced features.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Import failed',
          description: error.message,
        });
      }
    } finally {
      setImporting(false);
    }
  };

  const handleRetry = () => {
    fetchDiscordData();
  };

  const handleSignInWithDiscord = async () => {
    try {
      const redirectUrl = `${window.location.origin}/listings`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectUrl,
          scopes: 'identify email guilds',
          queryParams: {
            prompt: 'consent' // Force re-consent to ensure we get fresh tokens
          }
        },
      });

      if (error) {
        console.error('Discord sign-in error:', error);
        toast({
          variant: 'destructive',
          title: 'Sign-in failed',
          description: error.message,
        });
      }
    } catch (error: any) {
      console.error('Error signing in with Discord:', error);
      toast({
        variant: 'destructive',
        title: 'Sign-in failed',
        description: 'Failed to sign in with Discord',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        variant: 'destructive',
        title: 'Sign-out failed',
        description: error.message,
      });
    }
  };

  const getErrorHelp = () => {
    switch (errorCode) {
      case 'DISCORD_TOKEN_EXPIRED':
      case 'NO_DISCORD_TOKEN':
        return (
          <Alert className="bg-yellow-900/20 border-yellow-500 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-200">
              Your Discord session has expired. Please sign out and sign back in with Discord to refresh your authentication.
            </AlertDescription>
          </Alert>
        );
      case 'DISCORD_PERMISSIONS_ERROR':
        return (
          <Alert className="bg-blue-900/20 border-blue-500 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-blue-200">
              Missing Discord permissions. Please re-authenticate with Discord to grant the necessary permissions.
            </AlertDescription>
          </Alert>
        );
      case 'NOT_DISCORD_USER':
        return (
          <Alert className="bg-red-900/20 border-red-500 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              You need to sign in with Discord to use this feature.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !importing && onOpenChange(next)}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[#2C2F33] border-[#40444B] text-white">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">Add Your Server</DialogTitle>
          <DialogDescription className="text-green-400">
            We need a little information to get you started
          </DialogDescription>
        </DialogHeader>

        {!isDiscordUser ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-yellow-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-white">Discord Authentication Required</h3>
              <p className="text-gray-400 max-w-md">
                To import your Discord Servers, you need to sign in with Discord. 
                You are currently signed in with email.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-[#40444B] text-gray-300 hover:bg-[#40444B]"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <Button
                onClick={handleSignInWithDiscord}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In with Discord
              </Button>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-white">Failed to fetch Discord data</h3>
              <p className="text-gray-400 max-w-md">{error}</p>
              {getErrorHelp()}
            </div>
            <div className="flex gap-2">
              {(errorCode === 'DISCORD_TOKEN_EXPIRED' || errorCode === 'NO_DISCORD_TOKEN') ? (
                <>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="border-[#40444B] text-gray-300 hover:bg-[#40444B]"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                  <Button
                    onClick={handleSignInWithDiscord}
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Re-authenticate with Discord
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleRetry}
                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-[#40444B] text-gray-300 hover:bg-[#40444B]"
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#5865F2]" />
            <span className="ml-2 text-white">Fetching your Discord data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Server Information Section */}
            <div className="bg-[#36393F] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Server className="h-5 w-5 text-white" />
                <h3 className="text-white font-semibold">Server Information</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="server-select" className="text-white">Select Server</Label>
                  <Select value={selectedServer} onValueChange={setSelectedServer}>
                    <SelectTrigger className="bg-[#2C2F33] border-[#40444B] text-white">
                      <SelectValue placeholder="-- Select Discord Server --" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2C2F33] border-[#40444B]">
                      <SelectItem value="" className="text-gray-400">-- Select Discord Server --</SelectItem>
                      <SelectItem value="owned" disabled className="text-gray-400">-- Owned Servers --</SelectItem>
                      {servers.filter(s => s.owner).map((server) => (
                        <SelectItem key={server.id} value={server.id} className="text-white">
                          {server.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="managed" disabled className="text-gray-400">-- Managed Servers --</SelectItem>
                      {servers.filter(s => !s.owner).map((server) => (
                        <SelectItem key={server.id} value={server.id} className="text-white">
                          {server.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="server-name" className="text-white">Server Name</Label>
                  <Input
                    id="server-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-[#2C2F33] border-[#40444B] text-white"
                    placeholder="Server name"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Required</p>
                </div>
              </div>
            </div>

            {/* Server Description */}
            <div>
              <Label htmlFor="description" className="text-white">Server Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-[#2C2F33] border-[#40444B] text-white min-h-[120px]"
                placeholder="A good description is vital so people can find your server. Your description will also be used by Google and other search engines to rank your page in their search results."
                required
              />
              <p className="text-xs text-gray-400 mt-1">Required</p>
            </div>

            {/* Banner Upload */}
            <div>
              <Label className="text-white">Banner</Label>
              <p className="text-xs text-gray-400 mb-2">Shows up across the top of your Servers page. (Width: 945px - Height: 290px)</p>
              <div className="border-2 border-dashed border-[#40444B] rounded-lg p-8 text-center bg-[#36393F]">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400">Drag & Drop your files or <span className="text-blue-400 underline cursor-pointer">Browse</span></p>
              </div>
              <div className="bg-red-900/20 border border-red-500 rounded p-2 mt-2">
                <p className="text-red-400 text-sm">Don't have graphics for your Discord server? Find Web Banner Artists on Fiverr!</p>
              </div>
            </div>

            {/* Vanity URL */}
            <div>
              <Label htmlFor="vanity" className="text-white">Vanity URL</Label>
              <div className="flex">
                <span className="bg-[#36393F] border border-[#40444B] px-3 py-2 text-gray-300 rounded-l-md">https://discord.me/</span>
                <Input
                  id="vanity"
                  value={formData.vanity_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, vanity_url: e.target.value }))}
                  className="bg-[#2C2F33] border-[#40444B] text-white rounded-l-none"
                  placeholder="vanity-url-here"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Required</p>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary-category" className="text-white">Primary Category</Label>
                <Select value={formData.primary_category} onValueChange={(value) => setFormData(prev => ({ ...prev, primary_category: value }))}>
                  <SelectTrigger className="bg-[#2C2F33] border-[#40444B] text-white">
                    <SelectValue placeholder="-- Select a Category --" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2C2F33] border-[#40444B]">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-white">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">Required</p>
              </div>

              <div>
                <Label htmlFor="secondary-category" className="text-white">Secondary Category</Label>
                <Select value={formData.secondary_category} onValueChange={(value) => setFormData(prev => ({ ...prev, secondary_category: value }))}>
                  <SelectTrigger className="bg-[#2C2F33] border-[#40444B] text-white">
                    <SelectValue placeholder="-- Select a Category --" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2C2F33] border-[#40444B]">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-white">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 mt-1">Optional</p>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags" className="text-white">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="bg-[#2C2F33] border-[#40444B] text-white"
                placeholder="Search for tags"
              />
              <p className="text-xs text-gray-400 mt-1">Optional - You can select up to 5 tags.</p>
            </div>

            {/* NSFW Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="nsfw"
                checked={formData.nsfw}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, nsfw: checked }))}
              />
              <Label htmlFor="nsfw" className="text-white">Server is NSFW-Focused</Label>
            </div>

            {/* Premium Notice */}
            {!isPremium && (
              <div className="p-3 bg-purple-900/20 border border-purple-600/30 rounded-lg">
                <p className="text-purple-400 text-sm">
                  <strong>Free Plan:</strong> You can import up to 3 servers total. 
                  Upgrade to Premium for unlimited imports and enhanced features.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-[#40444B]">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={importing}
                className="border-[#40444B] text-gray-300 hover:bg-[#40444B]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || !selectedServer || !formData.name.trim() || !formData.description.trim()}
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Importing...
                  </>
                ) : (
                  'Add Server'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DiscordImportModal;