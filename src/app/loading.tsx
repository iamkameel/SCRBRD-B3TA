
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-80" />
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Team Standings Skeleton */}
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-7 w-48" /></CardTitle>
                    <CardDescription><Skeleton className="h-5 w-full max-w-sm" /></CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-[200px] w-full" />
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"><Skeleton className="h-5 w-8" /></TableHead>
                                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...Array(3)].map((_, i) => (
                              <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                              </TableRow>
                          ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>

        {/* Top Performers Skeleton */}
        <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle><Skeleton className="h-7 w-40" /></CardTitle>
                <div className="flex items-center justify-between">
                  <CardDescription><Skeleton className="h-5 w-48" /></CardDescription>
                   <Skeleton className="h-10 w-[170px]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-[160px] w-full" />
                    {[...Array(3)].map((_, i) => (
                       <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-1">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                          <div className="text-right">
                             <Skeleton className="h-6 w-8 ml-auto" />
                          </div>
                       </div>
                     ))}
                   </div>
              </CardContent>
            </Card>
        </div>
      </div>

       {/* Recent Matches Skeleton */}
       <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-7 w-64" /></CardTitle>
          <CardDescription>
            <Skeleton className="h-5 w-full max-w-xs" />
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                <TableHead><Skeleton className="h-5 w-40" /></TableHead>
                <TableHead><Skeleton className="h-5 w-16" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardSkeleton;
