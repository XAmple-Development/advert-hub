
import { Button } from '@/components/ui/button';
import ModernCard from '@/components/ui/modern-card';
import { Search, TrendingUp, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Hero = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'Fun', color: 'bg-blue-500/20 text-blue-400' },
    { name: 'Moderation', color: 'bg-red-500/20 text-red-400' },
    { name: 'Utility', color: 'bg-green-500/20 text-green-400' },
    { name: 'Music', color: 'bg-purple-500/20 text-purple-400' },
    { name: 'Economy', color: 'bg-yellow-500/20 text-yellow-400' },
    { name: 'Social', color: 'bg-pink-500/20 text-pink-400' },
    { name: 'Game', color: 'bg-indigo-500/20 text-indigo-400' },
    { name: 'Meme', color: 'bg-orange-500/20 text-orange-400' },
    { name: 'Leveling', color: 'bg-teal-500/20 text-teal-400' },
    { name: 'Anime', color: 'bg-violet-500/20 text-violet-400' }
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/listings?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/listings?category=${encodeURIComponent(category)}`);
  };

  return (
    <section className="relative py-20 px-6 text-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <ModernCard className="p-16 mb-12 hover-lift" variant="premium">
          {/* Main Heading */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-primary-light bg-clip-text text-transparent animate-gradient">
                Discover Amazing
              </span>
              <br />
              <span className="text-foreground">Discord Communities</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Find the perfect Discord bots and servers for your community. Join millions of users exploring the best Discord has to offer.
            </p>
          </div>
          
          {/* Enhanced Search Bar */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              <div className="relative flex flex-col md:flex-row gap-4 bg-background-secondary rounded-2xl p-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-6 w-6" />
                  <input
                    type="text"
                    placeholder="Search for the perfect Discord bot or server..."
                    className="w-full pl-14 pr-6 py-5 text-lg rounded-xl bg-transparent border-0 focus:outline-none text-foreground placeholder:text-muted-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  size="lg" 
                  variant="cosmic"
                  className="px-10 py-5 text-lg"
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Categories */}
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-muted-foreground mb-6">Popular Categories</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {categories.map((category, index) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 hover:-translate-y-1 border-2 border-transparent hover:border-primary/30 backdrop-blur-sm ${category.color}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  #{category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col md:flex-row justify-center gap-6">
            <Button 
              onClick={() => navigate('/listings?type=bot')}
              size="xl"
              variant="premium"
              className="group"
            >
              <TrendingUp className="h-5 w-5 mr-2 group-hover:animate-bounce" />
              Explore Listings
            </Button>
            <Button 
              onClick={() => navigate('/listings?featured=true')}
              size="xl"
              variant="outline"
              className="group"
            >
              <Users className="h-5 w-5 mr-2 group-hover:animate-pulse" />
              Featured Servers
            </Button>
          </div>
        </ModernCard>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { label: 'Active Servers', value: '10,000+', icon: Users },
            { label: 'Discord Bots', value: '5,000+', icon: Zap },
            { label: 'Happy Users', value: '100,000+', icon: TrendingUp }
          ].map((stat, index) => (
            <ModernCard key={stat.label} className="p-8 text-center hover-float" variant="glass">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl mb-4">
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
              <div className="text-muted-foreground font-medium">{stat.label}</div>
            </ModernCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
