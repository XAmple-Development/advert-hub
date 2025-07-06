import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Users, Edit, Trash2, Plus, Clock } from 'lucide-react';

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
  };
  profiles?: {
    username: string;
  };
}

interface Listing {
  id: string;
  name: string;
  type: string;
}

export const AdminEventsManagement = () => {
  const [events, setEvents] = useState<ServerEvent[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ServerEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    event_type: 'community',
    max_participants: 50,
    listing_id: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    fetchListings();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('server_events')
        .select(`
          *,
          listings(name),
          profiles(username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
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

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('id, name, type')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const eventData = {
        ...formData,
        organizer_id: (await supabase.auth.getUser()).data.user?.id,
        current_participants: 0,
        status: 'upcoming'
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('server_events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('server_events')
          .insert([eventData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event created successfully"
        });
      }

      setShowCreateModal(false);
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        event_type: 'community',
        max_participants: 50,
        listing_id: '',
      });
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save event"
      });
    }
  };

  const handleEdit = (event: ServerEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      start_time: event.start_time.slice(0, 16), // Format for datetime-local input
      end_time: event.end_time?.slice(0, 16) || '',
      event_type: event.event_type || 'community',
      max_participants: event.max_participants || 50,
      listing_id: event.listing_id || '',
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('server_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
      
      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete event"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      upcoming: 'default',
      ongoing: 'secondary',
      completed: 'outline',
      cancelled: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Events Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading events...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Events Management
            </CardTitle>
            <CardDescription>
              Create and manage community events for your listings
            </CardDescription>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingEvent(null);
                setFormData({
                  title: '',
                  description: '',
                  start_time: '',
                  end_time: '',
                  event_type: 'community',
                  max_participants: 50,
                  listing_id: '',
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? 'Edit Event' : 'Create New Event'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_type">Event Type</Label>
                    <Select
                      value={formData.event_type}
                      onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="community">Community</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="discussion">Discussion</SelectItem>
                        <SelectItem value="contest">Contest</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="listing_id">Associated Listing</Label>
                  <Select
                    value={formData.listing_id}
                    onValueChange={(value) => setFormData({ ...formData, listing_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a listing (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {listings.map((listing) => (
                        <SelectItem key={listing.id} value={listing.id}>
                          {listing.name} ({listing.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="max_participants">Max Participants</Label>
                  <Input
                    id="max_participants"
                    type="number"
                    min="1"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No events found. Create your first event to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {event.event_type}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.listings?.name || 'No listing'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3 w-3" />
                      {new Date(event.start_time).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.current_participants}/{event.max_participants}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(event.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(event)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(event.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};