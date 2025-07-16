
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
    <section className="py-16 px-6 text-center">
      <div className="max-w-6xl mx-auto">
        <ModernCard className="p-12 mb-8" variant="gradient">
          <h1 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-primary via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Explore millions of Discord Bots and Discord Apps
          </h1>
          
          <div className="flex flex-col md:flex-row gap-3 max-w-4xl mx-auto mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <input
                type="text"
                placeholder="Search for the top bots in Discord..."
                className="w-full pl-12 pr-4 py-4 text-lg rounded-lg bg-card border border-border focus:border-primary focus:outline-none transition-colors text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <Button 
              onClick={handleSearch}
              size="lg" 
              className="px-8 py-4 text-lg rounded-lg bg-primary hover:bg-primary/90"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => handleCategoryClick(category.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${category.color}`}
              >
                #{category.name}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-8">
            <button 
              onClick={() => navigate('/listings?type=bot')}
              className="text-foreground text-lg font-semibold border-b-2 border-primary pb-2"
            >
              Discord Bots
            </button>
            <button 
              onClick={() => navigate('/listings?type=server')}
              className="text-muted-foreground text-lg font-semibold hover:text-foreground transition-colors pb-2"
            >
              Discord Servers
            </button>
          </div>
        </ModernCard>
      </div>
    </section>
  );
};

export default Hero;
