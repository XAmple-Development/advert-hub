import { useSubscription } from './useSubscription';

export const usePremiumFeatures = () => {
  const { subscription_tier, isPremium, isGold, isPlatinum } = useSubscription();

  const features = {
    // Bump mechanics
    bumpCooldownHours: isPlatinum ? 2 : isGold ? 3 : 6,
    bumpPoints: isPlatinum ? 2 : isGold ? 1.5 : 1,
    
    // Team limits
    maxTeamMembers: isPlatinum ? 15 : isGold ? 12 : 3,
    
    // Vanity URLs
    maxVanityUrls: isPlatinum ? 3 : isGold ? 2 : 0,
    
    // Features access
    canAddYoutubeTrailer: isPremium,
    canAddLinksInPosts: isPremium,
    canViewExtendedAnalytics: isPlatinum,
    canHaveLargeBanners: isPlatinum,
    
    // Listing priority
    listingPriority: isPlatinum ? 1 : isGold ? 2 : 3,
    
    // UI enhancements
    botAccent: isPlatinum ? 'platinum' : isGold ? 'gold' : 'none',
    premiumBadge: subscription_tier !== 'free',
  };

  const getFeatureLabel = (feature: string): string => {
    const labels: Record<string, string> = {
      bumpCooldownHours: `${features.bumpCooldownHours} hour bump cooldown`,
      bumpPoints: `${features.bumpPoints}x bump power`,
      maxTeamMembers: `Up to ${features.maxTeamMembers} team members`,
      maxVanityUrls: features.maxVanityUrls > 0 ? `${features.maxVanityUrls} custom vanity URLs` : 'No vanity URLs',
      canAddYoutubeTrailer: 'YouTube trailer support',
      canAddLinksInPosts: 'Links in bot posts',
      canViewExtendedAnalytics: '30-day statistics',
      canHaveLargeBanners: 'Large banner placement',
    };
    return labels[feature] || feature;
  };

  const hasFeature = (feature: keyof typeof features): boolean => {
    return Boolean(features[feature]);
  };

  return {
    ...features,
    subscription_tier,
    isPremium,
    isGold,
    isPlatinum,
    getFeatureLabel,
    hasFeature,
  };
};