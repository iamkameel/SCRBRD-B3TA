
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <header className="p-6 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-80" />
      </header>

      <Card>
        <CardContent className="p-2 flex flex-wrap items-center gap-2">
           <Skeleton className="h-10 w-full md:w-48" />
           <Skeleton className="h-10 w-full md:w-48" />
           <Skeleton className="h-10 w-full md:w-48" />
           <Skeleton className="h-10 w-full md:w-48" />
           <Skeleton className="h-10 w-full md:w-48" />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
         <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                   <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
         </div>
          <div className="lg:col-span-1 space-y-4">
            {[...Array(2)].map((_, i) => (
               <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                   <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
       </div>
    </div>
  );
}

export default DashboardSkeleton;
