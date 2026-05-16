import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function GalleryCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Skeleton className="aspect-4/3 w-full rounded-none" />
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 pt-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-16" />
      </CardFooter>
    </Card>
  );
}

export default function GalleryLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-20" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <GalleryCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
