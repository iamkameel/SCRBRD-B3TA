import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PlayersPage() {
  // Mock data for now, will be empty
  const players: any[] = [];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Players
          </h1>
          <p className="text-muted-foreground">
            Manage your player roster.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2" />
          Add Player
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Player Roster</CardTitle>
          <CardDescription>A list of all players in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length > 0 ? (
                players.map((player) => (
                  <TableRow key={player.personId}>
                    <TableCell className="font-medium flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={player.profileImageUrl} alt={`${player.firstName} ${player.lastName}`} />
                        <AvatarFallback>{player.firstName?.[0]}{player.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                      {player.firstName} {player.lastName}
                    </TableCell>
                    <TableCell>{player.email}</TableCell>
                    <TableCell>{player.roles.join(', ')}</TableCell>
                    <TableCell className="text-right">
                      {/* Action buttons will go here */}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No players found.
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
