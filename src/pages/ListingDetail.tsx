
import { useParams, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import ListingDetail from '@/components/ListingDetail';

const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/listings" replace />;
  }

  return (
    <div className="min-h-screen bg-[#2C2F33]">
      <Navbar />
      <ListingDetail />
    </div>
  );
};

export default ListingDetailPage;
