
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Users, TrendingUp, Sparkles, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-background via-background to-card overflow-hidden">
      {/* Cosmic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main cosmic orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float opacity-30"
          style={{
            background: 'var(--gradient-primary)',
            animation: 'float 6s ease-in-out infinite, morphShape 8s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl animate-float opacity-20"
          style={{
            background: 'var(--gradient-secondary)',
            animation: 'float 4s ease-in-out infinite reverse, morphShape 6s ease-in-out infinite reverse',
            animationDelay: '2s'
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl animate-float opacity-10"
          style={{
            background: 'var(--gradient-accent)',
            animation: 'float 8s ease-in-out infinite, morphShape 10s ease-in-out infinite',
            animationDelay: '1s'
          }}
        ></div>
        
        {/* Additional cosmic elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl animate-glow-pulse"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 bg-gradient-to-r from-secondary/30 to-primary/30 rounded-full blur-xl animate-glow-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/40 rounded-full animate-float opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20 flex items-center min-h-screen">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-12 animate-fade-in">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-3 px-6 py-3 glass-effect-strong rounded-full mb-8 animate-glow-pulse">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="gradient-text-primary font-bold text-lg">Premium Discord Growth Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-9xl font-black text-white mb-8 leading-tight animate-scale-in">
              <span className="block mb-4">Boost Your</span>
              <span className="block gradient-text animate-shimmer bg-gradient-to-r from-primary via-secondary to-accent bg-[length:200%_100%]" 
                    style={{
                      backgroundImage: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)), hsl(var(--primary)))',
                      backgroundSize: '200% 100%',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent'
                    }}>
                Discord Empire
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground mb-12 max-w-5xl mx-auto leading-relaxed px-4 animate-slide-up">
              Connect your Discord server or bot to our <span className="gradient-text-accent font-bold">premium advertising network</span>. 
              Get discovered by <span className="text-accent font-bold animate-glow-pulse">millions</span> and 
              grow <span className="text-secondary font-bold">exponentially</span> with our AI-powered promotion system.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 px-4 animate-slide-up">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="btn-cosmic group relative w-full sm:w-auto px-12 py-6 text-xl font-black rounded-3xl shadow-2xl animate-glow-pulse hover:animate-none transition-all duration-500 transform hover:scale-110">
                  <span className="flex items-center justify-center relative z-10">
                    <Zap className="mr-3 h-6 w-6 animate-bounce" />
                    Start Growing Now
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity -z-10 animate-glow-pulse"></div>
                </Button>
              </Link>
              <Button size="lg" className="btn-outline-glow w-full sm:w-auto px-12 py-6 text-xl font-bold rounded-3xl backdrop-blur-xl transition-all duration-500 transform hover:scale-110 hover-tilt">
                <Star className="mr-3 h-6 w-6" />
                Watch Demo
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
            <div className="card-glow group p-10 hover-lift hover-tilt">
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-8 animate-glow-pulse" 
                     style={{background: 'var(--gradient-primary)'}}>
                  <Users className="h-10 w-10 text-white animate-bounce-gentle" />
                </div>
                <h3 className="text-4xl font-black gradient-text-primary mb-4">10k+ Servers</h3>
                <p className="text-muted-foreground text-xl leading-relaxed">Connected to our massive cosmic network</p>
              </div>
            </div>
            
            <div className="card-glow group p-10 hover-lift hover-tilt" style={{animationDelay: '0.2s'}}>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-8 animate-glow-pulse" 
                     style={{background: 'var(--gradient-accent)', animationDelay: '0.5s'}}>
                  <Zap className="h-10 w-10 text-white animate-bounce-gentle" style={{animationDelay: '0.5s'}} />
                </div>
                <h3 className="text-4xl font-black gradient-text-secondary mb-4">AI-Powered Bumps</h3>
                <p className="text-muted-foreground text-xl leading-relaxed">Smart promotion across our quantum bot network</p>
              </div>
            </div>
            
            <div className="card-glow group p-10 hover-lift hover-tilt" style={{animationDelay: '0.4s'}}>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-8 animate-glow-pulse" 
                     style={{background: 'var(--gradient-secondary)', animationDelay: '1s'}}>
                  <TrendingUp className="h-10 w-10 text-white animate-bounce-gentle" style={{animationDelay: '1s'}} />
                </div>
                <h3 className="text-4xl font-black gradient-text mb-4">50M+ Views</h3>
                <p className="text-muted-foreground text-xl leading-relaxed">Monthly galactic advertisement impressions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
