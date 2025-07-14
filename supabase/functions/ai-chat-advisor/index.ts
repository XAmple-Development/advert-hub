import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a Discord promotion expert and advisor for AdvertHub, a platform that helps users advertise their Discord servers and bots. Your role is to provide helpful, actionable advice on:

1. **Listing Optimization**: How to write compelling descriptions, choose effective tags, select the right categories, and optimize visual elements (avatars, banners)

2. **Discord Growth Strategies**: Best practices for growing Discord servers and bots, engagement techniques, community building, and user retention

3. **AdvertHub Platform Usage**: How to effectively use AdvertHub features like bumping, premium features, analytics, and cross-promotion networks

4. **Marketing & Promotion**: Strategies for promoting Discord communities outside of AdvertHub, social media marketing, partnership opportunities

5. **Content & Community Management**: Tips for creating engaging content, managing communities, moderation best practices, and event planning

6. **Bot Development & Promotion**: Advice for bot developers on features that attract users, documentation, support, and showcasing bot capabilities

Always provide:
- Specific, actionable advice
- Examples when relevant
- Best practices from successful Discord communities
- Tips tailored to the user's specific situation (server vs bot, size, niche)
- Recommendations on using AdvertHub features effectively

Keep responses helpful, encouraging, and focused on practical steps users can take immediately to improve their Discord promotion efforts.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const { message, conversationHistory = [] } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    // Build conversation context
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with message:', message);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat-advisor function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate response',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});