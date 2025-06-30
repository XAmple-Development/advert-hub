
import { useEffect, useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

const PullToRefresh = ({ onRefresh, children, threshold = 100 }: PullToRefreshProps) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || window.scrollY > 0) return;

      const touchY = e.touches[0].clientY;
      const distance = Math.max(0, (touchY - touchStartY) * 0.5);
      
      if (distance > 0) {
        e.preventDefault();
        setPullDistance(distance);
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      
      setIsPulling(false);
      setPullDistance(0);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, onRefresh, isRefreshing]);

  return (
    <div className="relative">
      {(isPulling || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gradient-to-b from-purple-600/20 to-transparent z-50 transition-all duration-200"
          style={{ 
            height: Math.min(pullDistance, threshold),
            transform: `translateY(-${Math.min(pullDistance, threshold)}px)`
          }}
        >
          <div className="flex items-center gap-2 text-purple-400">
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">
              {isRefreshing ? 'Refreshing...' : pullDistance > threshold ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}
      
      <div style={{ transform: `translateY(${Math.min(pullDistance * 0.3, 30)}px)` }}>
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
