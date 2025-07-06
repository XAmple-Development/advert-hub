interface ListingAccentProps {
  tier: 'free' | 'gold' | 'platinum';
  children: React.ReactNode;
  className?: string;
}

export const ListingAccent = ({ tier, children, className = '' }: ListingAccentProps) => {
  const accentClasses = {
    free: '',
    gold: 'border-l-4 border-yellow-500 bg-gradient-to-r from-yellow-500/5 to-transparent',
    platinum: 'border-l-4 border-slate-300 bg-gradient-to-r from-slate-400/10 to-transparent relative overflow-hidden',
  };

  return (
    <div className={`${accentClasses[tier]} ${className}`}>
      {tier === 'platinum' && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-400/5 via-white/5 to-transparent pointer-events-none" />
      )}
      {children}
    </div>
  );
};