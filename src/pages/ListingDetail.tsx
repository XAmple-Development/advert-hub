
import { useParams, Navigate } from 'react-router-dom';
import ListingDetail from '@/components/ListingDetail';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/LoadingSpinner';

const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/listings" replace />;
  }

  return (
    <div className="min-h-screen bg-[#2C2F33]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <ListingDetail />
      </div>
    </div>
  );
};

export default ListingDetailPage;
