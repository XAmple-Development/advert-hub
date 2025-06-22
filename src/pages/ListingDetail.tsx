
import { useParams } from 'react-router-dom';
import ListingDetail from '@/components/ListingDetail';

const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="min-h-screen bg-[#2C2F33] flex items-center justify-center">
        <div className="text-white text-xl">Invalid listing ID</div>
      </div>
    );
  }

  return <ListingDetail />;
};

export default ListingDetailPage;
