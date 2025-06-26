
import { useParams, Navigate } from 'react-router-dom';
import ListingDetail from '@/components/ListingDetail';

const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/listings" replace />;
  }

  return <ListingDetail />;
};

export default ListingDetailPage;
