import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NewMatchPage() {
  return (
    <div className="flex flex-col gap-8">
       <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Create a New Match
        </h1>
        <p className="text-muted-foreground">
          Set up the details for your next fixture.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Match Setup</CardTitle>
          <CardDescription>
            Select teams, venue, and officials to start a new match.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Fixture creation form will be here. You'll be able to select from your existing teams and players.
          </p>
           <Button disabled>Start Scoring</Button>
        </CardContent>
      </Card>
    </div>
  )
}
