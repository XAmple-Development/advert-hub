
import AdminDashboard from '@/components/AdminDashboard';
import Navbar from '@/components/Navbar';
import ModernLayout from '@/components/layout/ModernLayout';

const AdminDashboardPage = () => {
  return (
    <ModernLayout>
      <Navbar />
      <AdminDashboard />
    </ModernLayout>
  );
};

export default AdminDashboardPage;
