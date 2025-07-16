
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/Breadcrumbs';
import ListingsPage from '@/components/ListingsPage';
import PullToRefresh from '@/components/PullToRefresh';
import ModernLayout from '@/components/layout/ModernLayout';
import { useState } from 'react';

const Listings = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = async () => {
    // Trigger a refresh by updating the key
    setRefreshKey(prev => prev + 1);
    // Add a small delay to show the refresh animation
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  return (
    <ModernLayout>
      <Navbar />
      <Breadcrumbs />
      <PullToRefresh onRefresh={handleRefresh}>
        <ListingsPage key={refreshKey} />
      </PullToRefresh>
    </ModernLayout>
  );
};

export default Listings;
