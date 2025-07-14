import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, RefreshCw, Zap, TrendingUp } from 'lucide-react';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTrendingCalculation = async () => {
    setLoading(true);
    try {
      console.log('Running trending calculation...');
      const { data, error } = await supabase.functions.invoke('calculate-trending');
      
      if (error) {
        console.error('Trending calculation error:', error);
        setResults({ type: 'error', data: error });
      } else {
        console.log('Trending calculation success:', data);
        setResults({ type: 'success', data });
      }
    } catch (err) {
      console.error('Trending calculation failed:', err);
      setResults({ type: 'error', data: err });
    } finally {
      setLoading(false);
    }
  };

  const runAIRecommendations = async () => {
    setLoading(true);
    try {
      console.log('Running AI recommendations...');
      
      // Get a user ID first
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
      const userId = profiles?.[0]?.id;
      
      if (!userId) {
        setResults({ type: 'error', data: 'No user found for testing' });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('ai-server-recommendations', {
        body: { user_id: userId }
      });
      
      if (error) {
        console.error('AI recommendations error:', error);
        setResults({ type: 'error', data: error });
      } else {
        console.log('AI recommendations success:', data);
        setResults({ type: 'success', data });
      }
    } catch (err) {
      console.error('AI recommendations failed:', err);
      setResults({ type: 'error', data: err });
    } finally {
      setLoading(false);
    }
  };

  const checkTrendingData = async () => {
    try {
      const { data } = await supabase
        .from('trending_metrics')
        .select('*')
        .limit(5);
      
      setResults({ type: 'info', data: { trending_metrics: data } });
    } catch (err) {
      setResults({ type: 'error', data: err });
    }
  };

  const checkAIData = async () => {
    try {
      const { data } = await supabase
        .from('ai_recommendations')
        .select('*')
        .limit(5);
      
      setResults({ type: 'info', data: { ai_recommendations: data } });
    } catch (err) {
      setResults({ type: 'error', data: err });
    }
  };

  // Only show in development
  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="mb-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Debug Panel
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="w-80 max-h-96 overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-sm">AI & Trending Debug</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={runTrendingCalculation}
                  disabled={loading}
                  size="sm"
                  className="text-xs"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Run Trending
                </Button>
                
                <Button 
                  onClick={runAIRecommendations}
                  disabled={loading}
                  size="sm"
                  className="text-xs"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Run AI Recs
                </Button>
                
                <Button 
                  onClick={checkTrendingData}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Check Trending
                </Button>
                
                <Button 
                  onClick={checkAIData}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  Check AI Data
                </Button>
              </div>
              
              {results && (
                <div className="text-xs">
                  <Badge 
                    variant={results.type === 'error' ? 'destructive' : 'default'}
                    className="mb-2"
                  >
                    {results.type}
                  </Badge>
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(results.data, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default DebugPanel;