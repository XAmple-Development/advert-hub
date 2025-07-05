
import AuthForm from '@/components/AuthForm';
import Navbar from '@/components/Navbar';

const Auth = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <Navbar />
      <AuthForm />
    </div>
  );
};

export default Auth;
