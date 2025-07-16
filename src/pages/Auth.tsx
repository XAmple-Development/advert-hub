
import AuthForm from '@/components/AuthForm';
import Navbar from '@/components/Navbar';
import ModernLayout from '@/components/layout/ModernLayout';
import ModernCard from '@/components/ui/modern-card';
import { Sparkles, Shield, Users, Trophy } from 'lucide-react';

const Auth = () => {
  return (
    <ModernLayout>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-6xl w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Hero content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 glass-effect-strong rounded-full">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium gradient-text">Join 10,000+ Discord Communities</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
                  Welcome to
                  <span className="block gradient-text">AdvertHub</span>
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-lg">
                  The ultimate platform for Discord server growth, bot promotion, and community building.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ModernCard variant="glass" className="p-4 text-center">
                  <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-white">Secure</div>
                  <div className="text-sm text-muted-foreground">Discord OAuth</div>
                </ModernCard>
                
                <ModernCard variant="glass" className="p-4 text-center">
                  <Users className="h-8 w-8 text-secondary mx-auto mb-2" />
                  <div className="font-semibold text-white">Community</div>
                  <div className="text-sm text-muted-foreground">Real Growth</div>
                </ModernCard>
                
                <ModernCard variant="glass" className="p-4 text-center">
                  <Trophy className="h-8 w-8 text-accent mx-auto mb-2" />
                  <div className="font-semibold text-white">Premium</div>
                  <div className="text-sm text-muted-foreground">Features</div>
                </ModernCard>
              </div>
            </div>

            {/* Right side - Auth form */}
            <div className="flex justify-center">
              <ModernCard variant="premium" className="p-8 w-full max-w-md">
                <AuthForm />
              </ModernCard>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
};

export default Auth;
