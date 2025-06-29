
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SkeletonCardProps {
  showAvatar?: boolean;
  showBanner?: boolean;
  lines?: number;
}

const SkeletonCard = ({ showAvatar = true, showBanner = false, lines = 3 }: SkeletonCardProps) => {
  return (
    <Card className="bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl overflow-hidden">
      {showBanner && <Skeleton className="h-32 w-full rounded-none" />}
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          {showAvatar && <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
        ))}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  );
};

export default SkeletonCard;
