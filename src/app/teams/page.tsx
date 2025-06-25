import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";

export default function TeamsPage() {
  // Mock data for now, will be empty
  const teams: any[] = [];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Teams
          </h1>
          <p className="text-muted-foreground">
            Manage your cricket teams.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2" />
          Add Team
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Team List</CardTitle>
          <CardDescription>A list of all teams in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Division</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.length > 0 ? (
                teams.map((team) => (
                  <TableRow key={team.teamId}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.schoolName}</TableCell>
                    <TableCell>{team.divisionName}</TableCell>
                    <TableCell className="text-right">
                      {/* Action buttons will go here */}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No teams found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
