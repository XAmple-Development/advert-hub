
import ModernCard from '@/components/ui/modern-card';
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
  bumpType?: string;
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
    const source = activity.bumpType === 'discord' ? ' (via Discord Bot)' : '';
    switch (activity.type) {
      case 'bump': return `${activity.listingName} was bumped${source}`;
      case 'join': return `Someone joined ${activity.listingName}`;
      case 'new_listing': return `${activity.listingName} was listed`;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {stats.map((_, index) => (
          <ModernCard key={index} className="p-6 animate-pulse">
            <div className="h-16 bg-muted/30 rounded-lg mb-4"></div>
            <div className="h-8 bg-muted/30 rounded mb-2"></div>
            <div className="h-4 bg-muted/30 rounded w-2/3"></div>
          </ModernCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <ModernCard key={index} className="p-6" variant="glass" hover>
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={`h-8 w-8 ${stat.textColor}`} />
              <Badge variant="outline" className={`${stat.borderColor} ${stat.textColor} bg-transparent`}>
                Live
              </Badge>
            </div>
            <div className="text-3xl font-bold mb-1">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-sm font-medium">
              {stat.title}
            </div>
          </ModernCard>
        ))}
      </div>

      {/* Recent Activity */}
      <ModernCard className="p-6" variant="glass">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-primary" />
          Recent Activity
        </h2>
        <div>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity) => (
                <ModernCard key={activity.id} className="p-3" hover>
                  <div className="flex items-center gap-3">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {getActivityText(activity)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.listingType}
                    </Badge>
                  </div>
                </ModernCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <div className="text-muted-foreground">No recent activity</div>
            </div>
          )}
        </div>
      </ModernCard>
    </div>
  );
};

export default StatsCards;
