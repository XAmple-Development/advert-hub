
import AdminDashboard from '@/components/AdminDashboard';
import Navbar from '@/components/Navbar';

const AdminDashboardPage = () => {
  return (
    <div className="min-h-screen bg-[#2C2F33]">
      <Navbar />
      <AdminDashboard />
    </div>
  );
};

export default AdminDashboardPage;
