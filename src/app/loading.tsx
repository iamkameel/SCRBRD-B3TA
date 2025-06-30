
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header Skeleton */}
      <header className="p-6 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-80" />
      </header>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
               <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-4">
           <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardSkeleton;
