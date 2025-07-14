import { supabase } from '@/integrations/supabase/client';

export const testRecommendations = async () => {
  try {
    console.log('Testing AI recommendations...');
    
    // Test trending calculation
    const trendingResponse = await supabase.functions.invoke('calculate-trending');
    console.log('Trending calculation result:', trendingResponse);
    
    // Test AI recommendations with a sample user ID
    const recommendationsResponse = await supabase.functions.invoke('ai-server-recommendations', {
      body: { user_id: 'fc096043-c506-4989-b3e9-b1c2b7a929d4' }
    });
    console.log('AI recommendations result:', recommendationsResponse);
    
    // Check if trending data was created
    const { data: trendingData } = await supabase
      .from('trending_metrics')
      .select('*')
      .limit(5);
    console.log('Trending data:', trendingData);
    
    // Check if AI recommendations were created
    const { data: aiData } = await supabase
      .from('ai_recommendations')
      .select('*')
      .limit(5);
    console.log('AI recommendations data:', aiData);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Auto-run when this file is loaded in development
if (typeof window !== 'undefined') {
  console.log('Test recommendations function available: testRecommendations()');
  (window as any).testRecommendations = testRecommendations;
}