
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Users, Star, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CreateListingModal from '@/components/CreateListingModal';
import EditListingModal from '@/components/EditListingModal';
import DiscordImportModal from '@/components/DiscordImportModal';

interface Listing {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  description: string;
  long_description: string | null;
  type: 'server' | 'bot';
  discord_id: string;
  invite_url: string | null;
  website_url: string | null;
  support_server_url: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  member_count: number;
  online_count: number;
  boost_level: number;
  featured: boolean;
  nsfw: boolean;
  verification_level: string | null;
  status: 'pending' | 'active' | 'suspended';
  last_bumped_at: string | null;
  bump_count: number;
  view_count: number;
  join_count: number;
  tags: string[];
  discord_webhook_url: string | null;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, description }) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <CardDescription className="text-xs text-gray-500">{description}</CardDescription>}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isDiscordImportModalOpen, setIsDiscordImportModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching listings:', error);
        toast({
          title: "Error",
          description: "Failed to fetch listings.",
          variant: "destructive",
        });
      }

      setListings(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  const handleListingCreated = async () => {
    console.log('New listing created');
    fetchListings();
    setIsCreateModalOpen(false);
    toast({
      title: "Success",
      description: "Listing created successfully!",
    });
  };

  const handleListingUpdated = async () => {
    console.log('Listing updated');
    fetchListings();
    setIsEditModalOpen(false);
    setSelectedListing(null);
    toast({
      title: "Success",
      description: "Listing updated successfully!",
    });
  };

  const handleListingDeleted = async (listingId: string) => {
    console.log('Listing deleted:', listingId);
    fetchListings();
    toast({
      title: "Success",
      description: "Listing deleted successfully!",
    });
  };

  const handleEditListing = (listing: Listing) => {
    setSelectedListing(listing);
    setIsEditModalOpen(true);
  };

  const openDiscordImportModal = () => {
    setIsDiscordImportModalOpen(true);
  };

  const closeDiscordImportModal = () => {
    setIsDiscordImportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <Button onClick={() => setIsCreateModalOpen(true)}><Plus className="mr-2" /> Add Listing</Button>
          </div>
        </div>
      </header>

      <nav className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6 lg:px-8">
          <ul className="flex space-x-4">
            <li>
              <Button variant="link" onClick={() => navigate('/admin/settings')}><Settings className="mr-2" />Settings</Button>
            </li>
          </ul>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard title="Total Listings" value={listings.length} icon={<TrendingUp className="h-5 w-5 text-gray-500" />} />
          <StatsCard title="Total Members" value={listings.reduce((acc, listing) => acc + listing.member_count, 0)} icon={<Users className="h-5 w-5 text-gray-500" />} />
          <StatsCard title="Active Listings" value={listings.filter(listing => listing.status === 'active').length} icon={<Star className="h-5 w-5 text-gray-500" />} />
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Listings</CardTitle>
            <CardDescription>Manage your Discord server and bot listings.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading listings...</p>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map((listing) => (
                  <Card key={listing.id} className="shadow-sm">
                    <CardHeader>
                      <CardTitle>{listing.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        {listing.status === 'active' && <Badge>Active</Badge>}
                        {listing.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                        {listing.status === 'suspended' && <Badge variant="destructive">Suspended</Badge>}
                        <CardDescription className="text-gray-500">{listing.type}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{listing.description.substring(0, 50)}...</p>
                      <div className="flex justify-between mt-4">
                        <Button size="sm" onClick={() => handleEditListing(listing)}>Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p>No listings found.</p>
            )}
          </CardContent>
        </Card>

        <CreateListingModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSuccess={handleListingCreated}
        />

        {selectedListing && (
          <EditListingModal
            open={isEditModalOpen}
            onOpenChange={(open) => {
              setIsEditModalOpen(open);
              if (!open) setSelectedListing(null);
            }}
            listing={selectedListing}
            onSuccess={handleListingUpdated}
          />
        )}

        <DiscordImportModal
          open={isDiscordImportModalOpen}
          onOpenChange={setIsDiscordImportModalOpen}
          onImportComplete={fetchListings}
        />
      </main>
    </div>
  );
};

export default Dashboard;
