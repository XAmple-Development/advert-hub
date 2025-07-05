import Navbar from '@/components/Navbar';
import LiveActivityFeed from '@/components/realtime/LiveActivityFeed';
import { Activity } from 'lucide-react';

const LiveActivity = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Activity className="h-8 w-8 text-purple-400" />
            Live Activity Feed
          </h1>
          <p className="text-gray-300 text-lg">
            See what's happening in real-time across the platform
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <LiveActivityFeed />
        </div>
      </div>
    </div>
  );
};

export default LiveActivity;