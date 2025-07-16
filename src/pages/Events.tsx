import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import ModernLayout from '@/components/layout/ModernLayout';
import ModernCard from '@/components/ui/modern-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Users, Clock, MapPin, ExternalLink } from 'lucide-react';

interface ServerEvent {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  event_type: string;
  max_participants: number;
  current_participants: number;
  status: string;
  listing_id: string;
  organizer_id: string;
  created_at: string;
  listings?: {
    name: string;
    avatar_url?: string;
  };
  profiles?: {
    username: string;
  };
  user_registered?: boolean;
}

const Events = () => {
  const [events, setEvents] = useState<ServerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('server_events')
        .select(`
          *,
          listings(name, avatar_url),
          profiles(username)
        `)
        .eq('status', 'upcoming')
        .order('start_time', { ascending: true });

      const { data: eventsData, error: eventsError } = await query;
      if (eventsError) throw eventsError;

      let eventsWithRegistration = eventsData || [];

      // Check user registration status if authenticated
      if (user && eventsData?.length) {
        const eventIds = eventsData.map(event => event.id);
        const { data: participantData, error: participantError } = await supabase
          .from('event_participants')
          .select('event_id')
          .eq('user_id', user.id)
          .in('event_id', eventIds)
          .eq('status', 'registered');

        if (participantError) throw participantError;

        const registeredEventIds = new Set(participantData?.map(p => p.event_id) || []);
        
        eventsWithRegistration = eventsData.map(event => ({
          ...event,
          user_registered: registeredEventIds.has(event.id)
        }));
      }

      setEvents(eventsWithRegistration);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch events"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (eventId: string, isRegistering: boolean) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to RSVP to events"
      });
      return;
    }

    setRsvpLoading(eventId);
    
    try {
      if (isRegistering) {
        const { error } = await supabase
          .from('event_participants')
          .insert({
            event_id: eventId,
            user_id: user.id,
            status: 'registered'
          });

        if (error) throw error;

        // Update participant count
        const { error: updateError } = await supabase
          .from('server_events')
          .update({ current_participants: events.find(e => e.id === eventId)!.current_participants + 1 })
          .eq('id', eventId);

        if (updateError) throw updateError;

        toast({
          title: "Success!",
          description: "You've successfully registered for this event"
        });
      } else {
        const { error } = await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update participant count
        const { error: updateError } = await supabase
          .from('server_events')
          .update({ current_participants: Math.max(0, events.find(e => e.id === eventId)!.current_participants - 1) })
          .eq('id', eventId);

        if (updateError) throw updateError;

        toast({
          title: "Registration Cancelled",
          description: "You've cancelled your registration for this event"
        });
      }

      fetchEvents(); // Refresh events
    } catch (error: any) {
      console.error('RSVP error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update registration"
      });
    } finally {
      setRsvpLoading(null);
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      community: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      gaming: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      discussion: 'bg-green-500/20 text-green-300 border-green-500/30',
      contest: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      announcement: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const upcomingEvents = events.filter(event => new Date(event.start_time) > new Date());
  const pastEvents = events.filter(event => new Date(event.start_time) <= new Date());
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.start_time);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  if (loading) {
    return (
      <ModernLayout>
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <ModernCard className="p-8">
            <div className="text-2xl font-bold">Loading events...</div>
          </ModernCard>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <Navbar />
      
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <ModernCard className="p-8 mb-12" variant="gradient">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full mb-8">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-primary font-medium">Community Events</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black mb-6">
              Upcoming
              <span className="block bg-gradient-to-r from-primary via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Events
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl leading-relaxed">
              Join exciting community events, gaming sessions, discussions, and contests. Connect with like-minded people and make new friends.
            </p>
          </ModernCard>

          <Tabs defaultValue="upcoming" className="space-y-8">
            <TabsList className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2">
              <TabsTrigger 
                value="upcoming" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium"
              >
                Upcoming ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger 
                value="today" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium"
              >
                Today ({todayEvents.length})
              </TabsTrigger>
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-600 data-[state=active]:to-gray-700 data-[state=active]:text-white rounded-xl px-6 py-3 font-medium"
              >
                All Events ({events.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-6">
              {upcomingEvents.length === 0 ? (
                <ModernCard className="p-16 text-center" variant="glass">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                    <Calendar className="h-10 w-10 text-primary" />
                  </div>
                  <div className="text-2xl font-bold mb-2">No upcoming events</div>
                  <div className="text-muted-foreground text-lg">Check back soon for new community events!</div>
                </ModernCard>
              ) : (
                <div className="grid gap-6">
                  {upcomingEvents.map((event) => (
                    <ModernCard key={event.id} className="p-8" variant="glass" hover>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-6">
                          {event.listings?.avatar_url ? (
                            <img
                              src={event.listings.avatar_url}
                              alt={event.listings.name}
                              className="w-16 h-16 rounded-2xl"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-r from-primary to-pink-600 rounded-2xl flex items-center justify-center">
                              <Calendar className="h-8 w-8 text-white" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                            <div className="flex items-center gap-3 mb-3">
                              <Badge className={getEventTypeColor(event.event_type || 'community')}>
                                {event.event_type}
                              </Badge>
                              {event.listings && (
                                <Badge variant="outline" className="text-muted-foreground">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {event.listings.name}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(event.start_time).toLocaleDateString()} at {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {event.current_participants}/{event.max_participants} registered
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {user ? (
                            <Button
                              onClick={() => handleRSVP(event.id, !event.user_registered)}
                              disabled={rsvpLoading === event.id || (!event.user_registered && event.current_participants >= event.max_participants)}
                              size="lg"
                              className={event.user_registered 
                                ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                                : "bg-gradient-to-r from-primary to-pink-600 hover:from-primary/80 hover:to-pink-600/80"
                              }
                            >
                              {rsvpLoading === event.id ? 'Processing...' : 
                               event.user_registered ? 'Cancel RSVP' : 
                               event.current_participants >= event.max_participants ? 'Event Full' : 'RSVP'}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => toast({
                                variant: "destructive",
                                title: "Authentication Required",
                                description: "Please sign in to RSVP to events"
                              })}
                              size="lg"
                              className="bg-gradient-to-r from-primary to-pink-600 hover:from-primary/80 hover:to-pink-600/80"
                            >
                              Sign In to RSVP
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {event.description && (
                        <div className="mt-6 pt-6 border-t border-border/30">
                          <p className="text-muted-foreground text-lg leading-relaxed">{event.description}</p>
                        </div>
                      )}
                    </ModernCard>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="today" className="space-y-6">
              {todayEvents.length === 0 ? (
                <ModernCard className="p-16 text-center" variant="glass">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-500/10 rounded-full mb-6">
                    <Clock className="h-10 w-10 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold mb-2">No events today</div>
                  <div className="text-muted-foreground text-lg">Check out upcoming events instead!</div>
                </ModernCard>
              ) : (
                <div className="grid gap-6">
                  {todayEvents.map((event) => (
                    <ModernCard key={event.id} className="p-8" variant="glass" hover>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-6">
                          {event.listings?.avatar_url ? (
                            <img
                              src={event.listings.avatar_url}
                              alt={event.listings.name}
                              className="w-16 h-16 rounded-2xl"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl flex items-center justify-center">
                              <Calendar className="h-8 w-8 text-white" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                            <div className="flex items-center gap-3 mb-3">
                              <Badge className={getEventTypeColor(event.event_type || 'community')}>
                                {event.event_type}
                              </Badge>
                              <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30">
                                Today
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {event.current_participants}/{event.max_participants} registered
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          {user ? (
                            <Button
                              onClick={() => handleRSVP(event.id, !event.user_registered)}
                              disabled={rsvpLoading === event.id || (!event.user_registered && event.current_participants >= event.max_participants)}
                              size="lg"
                              className={event.user_registered 
                                ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                                : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                              }
                            >
                              {rsvpLoading === event.id ? 'Processing...' : 
                               event.user_registered ? 'Cancel RSVP' : 
                               event.current_participants >= event.max_participants ? 'Event Full' : 'RSVP'}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => toast({
                                variant: "destructive", 
                                title: "Authentication Required",
                                description: "Please sign in to RSVP to events"
                              })}
                              size="lg"
                              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                            >
                              Sign In to RSVP
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {event.description && (
                        <div className="mt-6 pt-6 border-t border-border/30">
                          <p className="text-muted-foreground text-lg leading-relaxed">{event.description}</p>
                        </div>
                      )}
                    </ModernCard>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-6">
              {events.length === 0 ? (
                <ModernCard className="p-16 text-center" variant="glass">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-muted/10 rounded-full mb-6">
                    <Calendar className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold mb-2">No events found</div>
                  <div className="text-muted-foreground text-lg">Events will appear here once they're created!</div>
                </ModernCard>
              ) : (
                <div className="grid gap-6">
                  {events.map((event) => {
                    const isPastEvent = new Date(event.start_time) <= new Date();
                    return (
                      <ModernCard key={event.id} className={`p-8 ${isPastEvent ? 'opacity-75' : ''}`} variant="glass" hover={!isPastEvent}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-6">
                            {event.listings?.avatar_url ? (
                              <img
                                src={event.listings.avatar_url}
                                alt={event.listings.name}
                                className="w-16 h-16 rounded-2xl"
                              />
                            ) : (
                              <div className={`w-16 h-16 bg-gradient-to-r ${isPastEvent ? 'from-muted/50 to-muted/70' : 'from-primary to-pink-600'} rounded-2xl flex items-center justify-center`}>
                                <Calendar className="h-8 w-8 text-white" />
                              </div>
                            )}
                            <div>
                              <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                              <div className="flex items-center gap-3 mb-3">
                                <Badge className={getEventTypeColor(event.event_type || 'community')}>
                                  {event.event_type}
                                </Badge>
                                {event.listings && (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {event.listings.name}
                                  </Badge>
                                )}
                                {isPastEvent && (
                                  <Badge className="bg-muted/20 text-muted-foreground border-muted/30">
                                    Past Event
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(event.start_time).toLocaleDateString()} at {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {event.current_participants}/{event.max_participants} registered
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            {!isPastEvent && user ? (
                              <Button
                                onClick={() => handleRSVP(event.id, !event.user_registered)}
                                disabled={rsvpLoading === event.id || (!event.user_registered && event.current_participants >= event.max_participants)}
                                size="lg"
                                className={event.user_registered 
                                  ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                                  : "bg-gradient-to-r from-primary to-pink-600 hover:from-primary/80 hover:to-pink-600/80"
                                }
                              >
                                {rsvpLoading === event.id ? 'Processing...' : 
                                 event.user_registered ? 'Cancel RSVP' : 
                                 event.current_participants >= event.max_participants ? 'Event Full' : 'RSVP'}
                              </Button>
                            ) : isPastEvent ? (
                              <Button
                                disabled
                                size="lg"
                                variant="outline"
                                className="cursor-not-allowed"
                              >
                                Event Ended
                              </Button>
                            ) : (
                              <Button
                                onClick={() => toast({
                                  variant: "destructive",
                                  title: "Authentication Required", 
                                  description: "Please sign in to RSVP to events"
                                })}
                                size="lg"
                                className="bg-gradient-to-r from-primary to-pink-600 hover:from-primary/80 hover:to-pink-600/80"
                              >
                                Sign In to RSVP
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {event.description && (
                          <div className="mt-6 pt-6 border-t border-border/30">
                            <p className="text-muted-foreground text-lg leading-relaxed">{event.description}</p>
                          </div>
                        )}
                      </ModernCard>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ModernLayout>
  );
};

export default Events;