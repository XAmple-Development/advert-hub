import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import ModernLayout from '@/components/layout/ModernLayout';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message with animation delay
    setTimeout(() => {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m your Discord promotion advisor powered by AI. I can help you optimize your server or bot listings, suggest growth strategies, and provide expert tips on using AdvertHub to reach your target audience. What would you like to know?',
        timestamp: new Date()
      }]);
    }, 500);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-advisor', {
        body: { 
          message: input.trim(),
          conversationHistory: messages.slice(-10)
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => (
      <div key={index} className={index > 0 ? 'mt-3' : ''}>
        {line.includes('**') ? (
          line.split('**').map((part, partIndex) => (
            partIndex % 2 === 1 ? (
              <strong key={partIndex} className="font-semibold text-foreground">{part}</strong>
            ) : (
              part
            )
          ))
        ) : (
          line
        )}
      </div>
    ));
  };

  return (
    <ModernLayout>
      <Navbar />
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-8 pb-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            AI-Powered Discord Advisor
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
            Discord Promotion Expert
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get personalized advice on growing your Discord server or bot through AdvertHub's powerful platform
          </p>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="container mx-auto px-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-2xl border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">AI Assistant</span>
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Online
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground font-normal">
                    Expert guidance for Discord growth and AdvertHub optimization
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea ref={scrollAreaRef} className="h-[60vh] p-6">
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-4 animate-fade-in ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                        message.role === 'user' 
                          ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                          : 'bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground border border-border/50'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="h-5 w-5" />
                        ) : (
                          <Bot className="h-5 w-5" />
                        )}
                      </div>
                      
                      <div className={`flex-1 ${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        <div className={`text-sm leading-relaxed max-w-[85%] ${
                          message.role === 'user' ? 'ml-auto' : 'mr-auto'
                        }`}>
                          {formatMessage(message.content)}
                        </div>
                        <div className={`mt-2 text-xs text-muted-foreground ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex items-start gap-4 animate-fade-in">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground border border-border/50 flex items-center justify-center shadow-md">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Input Section */}
              <div className="border-t bg-gradient-to-r from-background to-muted/20 p-6 rounded-b-lg">
                <div className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about Discord promotion strategies, listing optimization, or AdvertHub features..."
                      disabled={isLoading}
                      className="pr-12 py-6 text-base border-2 focus:border-primary/50 transition-colors rounded-xl resize-none"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button 
                    onClick={sendMessage} 
                    disabled={!input.trim() || isLoading}
                    size="lg"
                    className="h-12 w-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Press Enter to send • AI responses are generated and may contain inaccuracies
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModernLayout>
  );
};

export default Chat;