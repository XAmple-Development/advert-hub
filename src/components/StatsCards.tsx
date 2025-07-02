
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Server, Bot, Eye, Users, Calendar } from 'lucide-react';

interface StatsCardsProps {
  totalListings: number;
  totalServers: number;
  totalBots: number;
  totalViews: number;
  totalBumpsToday: number;
  recentActivity: Activity[];
  loading?: boolean;
}

interface Activity {
  id: string;
  type: 'bump' | 'join' | 'new_listing';
  listingName: string;
  timestamp: string;
  listingType: 'server' | 'bot';
}

const StatsCards = ({ 
  totalListings, 
  totalServers, 
  totalBots, 
  totalViews, 
  totalBumpsToday, 
  recentActivity,
  loading = false 
}: StatsCardsProps) => {
  const stats = [
    {
      title: 'Your Communities',
      value: totalListings,
      icon: Users,
      color: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-300'
    },
    {
      title: 'Your Servers',
      value: totalServers,
      icon: Server,
      color: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-300'
    },
    {
      title: 'Your Bots',
      value: totalBots,
      icon: Bot,
      color: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-300'
    },
    {
      title: 'Your Total Views',
      value: totalViews,
      icon: Eye,
      color: 'bg-gradient-to-r from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/30',
      textColor: 'text-orange-300'
    },
    {
      title: 'Your Bumps Today',
      value: totalBumpsToday,
      icon: TrendingUp,
      color: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20',
      borderColor: 'border-cyan-500/30',
      textColor: 'text-cyan-300'
    }
  ];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'bump': return <TrendingUp className="h-4 w-4 text-purple-400" />;
      case 'join': return <Users className="h-4 w-4 text-green-400" />;
      case 'new_listing': return <Calendar className="h-4 w-4 text-blue-400" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'bump': return `${activity.listingName} was bumped`;
      case 'join': return `Someone joined ${activity.listingName}`;
      case 'new_listing': return `${activity.listingName} was listed`;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((_, index) => (
          <Card key={index} className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-gray-700/50 rounded-lg mb-4"></div>
              <div className="h-8 bg-gray-700/50 rounded mb-2"></div>
              <div className="h-4 bg-gray-700/50 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className={`${stat.color} backdrop-blur-xl border ${stat.borderColor} rounded-2xl hover:scale-105 transition-transform duration-200`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <stat.icon className={`h-8 w-8 ${stat.textColor}`} />
                <Badge variant="outline" className={`${stat.borderColor} ${stat.textColor} bg-transparent`}>
                  Live
                </Badge>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stat.value.toLocaleString()}
              </div>
              <div className="text-gray-300 text-sm font-medium">
                {stat.title}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/30">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">
                      {getActivityText(activity)}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.listingType}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <div className="text-gray-400">No recent activity</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
