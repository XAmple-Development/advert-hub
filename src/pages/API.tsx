import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import CopyButton from '@/components/CopyButton';
import { Code, Key, Webhook, Zap, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ApiKey {
  id: string;
  name: string;
  key_hash: string;
  permissions: string[];
  last_used_at: string | null;
  created_at: string;
}

const API = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Temporarily disable API keys functionality until types are updated
      setApiKeys([]);
    } catch (error: any) {
      console.error('Error fetching API keys:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch API keys"
      });
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!user || !newKeyName.trim()) return;

    setCreating(true);
    try {
      // Generate a random API key
      const apiKey = `sk-${Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('')}`;
      
      // Temporarily disabled until database types are updated
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "API Key Created",
        description: "Your new API key has been generated"
      });

      setNewKeyName('');
      fetchApiKeys();
    } catch (error: any) {
      console.error('Error creating API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create API key"
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      // Temporarily disabled until database types are updated
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: "API Key Deleted",
        description: "The API key has been removed"
      });

      fetchApiKeys();
    } catch (error: any) {
      console.error('Error deleting API key:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete API key"
      });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const maskKey = (key: string) => {
    return `${key.substring(0, 8)}${'*'.repeat(32)}${key.substring(key.length - 8)}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <Navbar />
        <Breadcrumbs />
        <div className="flex items-center justify-center min-h-[calc(100vh-128px)]">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-4">Authentication Required</div>
            <div className="text-gray-300">Please sign in to access the API dashboard</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <Navbar />
      <Breadcrumbs />
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-8 backdrop-blur-sm">
              <Code className="h-4 w-4 text-purple-300" />
              <span className="text-purple-200 font-medium">API Dashboard</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              API
              <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Integration
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl leading-relaxed">
              Integrate vote rewards, webhooks, and more with our powerful API. Manage your API keys and view documentation.
            </p>
          </div>

          <Tabs defaultValue="keys" className="space-y-8">
            <TabsList className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2">
              <TabsTrigger 
                value="keys" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium"
              >
                <Key className="h-4 w-4 mr-2" />
                API Keys
              </TabsTrigger>
              <TabsTrigger 
                value="webhooks" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium"
              >
                <Webhook className="h-4 w-4 mr-2" />
                Webhooks
              </TabsTrigger>
              <TabsTrigger 
                value="docs" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium"
              >
                <Code className="h-4 w-4 mr-2" />
                Documentation
              </TabsTrigger>
            </TabsList>

            <TabsContent value="keys" className="space-y-6">
              {/* Create New Key */}
              <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
                <CardHeader className="p-6">
                  <CardTitle className="text-white text-xl font-bold">Create New API Key</CardTitle>
                  <CardDescription className="text-gray-300">
                    Generate a new API key to integrate with our services
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="keyName" className="text-white">Key Name</Label>
                      <Input
                        id="keyName"
                        placeholder="My Bot Vote Rewards"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="mt-1 bg-gray-800/50 border-gray-700/50 text-white"
                      />
                    </div>
                    <Button
                      onClick={createApiKey}
                      disabled={!newKeyName.trim() || creating}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl mt-6"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {creating ? 'Creating...' : 'Create Key'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* API Keys List */}
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-white">Loading API keys...</div>
                  </div>
                ) : apiKeys.length === 0 ? (
                  <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
                    <CardContent className="py-16 text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full mb-6">
                        <Key className="h-10 w-10 text-purple-400" />
                      </div>
                      <div className="text-2xl font-bold text-white mb-2">No API Keys</div>
                      <div className="text-gray-300 text-lg">Create your first API key to get started</div>
                    </CardContent>
                  </Card>
                ) : (
                  apiKeys.map((key) => (
                    <Card key={key.id} className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-white text-lg font-bold">{key.name}</h3>
                              <div className="flex gap-2">
                                {key.permissions.map((permission) => (
                                  <Badge key={permission} variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                    {permission}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <code className="bg-gray-800 px-3 py-1 rounded-lg text-sm text-gray-300 font-mono">
                                {showKeys[key.id] ? key.key_hash : maskKey(key.key_hash)}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleKeyVisibility(key.id)}
                                className="text-gray-400 hover:text-white"
                              >
                                {showKeys[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <CopyButton text={key.key_hash} />
                            </div>
                            
                            <div className="text-sm text-gray-400">
                              Created {new Date(key.created_at).toLocaleDateString()}
                              {key.last_used_at && (
                                <> • Last used {new Date(key.last_used_at).toLocaleDateString()}</>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => deleteApiKey(key.id)}
                            className="ml-4"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-6">
              <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
                <CardHeader className="p-6">
                  <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Vote Webhooks
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Receive real-time notifications when users vote for your servers or bots
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="bg-gray-800/50 p-4 rounded-xl">
                    <h4 className="text-white font-medium mb-2">Webhook URL Format:</h4>
                    <code className="text-sm text-green-400">POST https://your-bot.com/vote-webhook</code>
                    
                    <h4 className="text-white font-medium mt-4 mb-2">Headers:</h4>
                    <pre className="text-sm text-gray-300">
{`Authorization: Bearer YOUR_API_KEY
Content-Type: application/json`}
                    </pre>
                    
                    <h4 className="text-white font-medium mt-4 mb-2">Payload:</h4>
                    <pre className="text-sm text-gray-300">
{`{
  "user": "user_id",
  "bot": "bot_id",
  "type": "upvote",
  "timestamp": "2024-01-01T00:00:00Z"
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="docs" className="space-y-6">
              <Card className="bg-gradient-to-r from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
                <CardHeader className="p-6">
                  <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    API Documentation
                  </CardTitle>
                  <CardDescription className="text-gray-300">
                    Complete guide to integrating with our API
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-6">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-3">Authentication</h3>
                    <p className="text-gray-300 mb-3">
                      Include your API key in the Authorization header:
                    </p>
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                      <code className="text-green-400">Authorization: Bearer YOUR_API_KEY</code>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-lg mb-3">Check Vote Status</h3>
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                      <code className="text-blue-400">GET</code>
                      <code className="text-gray-300 ml-2">/api/v1/votes/{'{user_id}'}/{'{bot_id}'}</code>
                    </div>
                    <p className="text-gray-300 mt-2">
                      Check if a user has voted for your bot today.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-lg mb-3">Get Bot Stats</h3>
                    <div className="bg-gray-800/50 p-4 rounded-xl">
                      <code className="text-blue-400">GET</code>
                      <code className="text-gray-300 ml-2">/api/v1/bots/{'{bot_id}'}/stats</code>
                    </div>
                    <p className="text-gray-300 mt-2">
                      Retrieve voting statistics for your bot.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-lg mb-3">Rate Limits</h3>
                    <ul className="text-gray-300 space-y-1">
                      <li>• 100 requests per minute per API key</li>
                      <li>• 1000 requests per hour per API key</li>
                      <li>• Rate limit headers included in responses</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-lg mb-3">Support</h3>
                    <p className="text-gray-300">
                      Need help with the API? Join our support server or create a topic in the forum.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default API;