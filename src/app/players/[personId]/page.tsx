"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, PlusCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


// Mock Data (Should be centralized later)
const mockPeople = [
    { personId: "person_1", firstName: "John", lastName: "Doe", email: "john.doe@example.com", roles: ["Player"] },
    { personId: "person_2", firstName: "Jane", lastName: "Smith", email: "jane.smith@example.com", roles: ["Player", "Guardian"] },
    { personId: "person_3", firstName: "Peter", lastName: "Jones", email: "peter.jones@example.com", roles: ["Coach", "Umpire", "Guardian"] },
    { personId: "person_4", firstName: "Mary", lastName: "Williams", email: "mary.w@example.com", roles: ["Player", "Scorer"] },
    { personId: "person_5", firstName: "Sam", lastName: "Brown", email: "sam.b@example.com", roles: ["Player"] },
    { personId: "person_6", firstName: "Emily", lastName: "Davis", email: "emily.d@example.com", roles: ["Guardian"] },
];

const mockParentChildLinks: { parentId: string, childId: string }[] = [
    { parentId: "person_2", childId: "person_5" },
    { parentId: "person_3", childId: "person_1" },
];

interface Person {
  personId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  roles: string[];
}

const linkSchema = z.object({
  personId: z.string({ required_error: "Please select a person." }),
  relationship: z.enum(["guardian", "child"], { required_error: "Please select a relationship." }),
});

type LinkSchemaValues = z.infer<typeof linkSchema>;

function AddLinkDialog({ currentPerson, onLinkAdded }: { currentPerson: Person, onLinkAdded: (link: { person: Person, relationship: 'guardian' | 'child'}) => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<LinkSchemaValues>({
    resolver: zodResolver(linkSchema),
  });

  const availablePeople = mockPeople.filter(p => p.personId !== currentPerson.personId);

  function onSubmit(data: LinkSchemaValues) {
    const linkedPerson = mockPeople.find(p => p.personId === data.personId);
    if (!linkedPerson) return;
    
    onLinkAdded({ person: linkedPerson, relationship: data.relationship });
    toast({
      title: "Link Created",
      description: `${currentPerson.firstName} ${currentPerson.lastName} is now linked to ${linkedPerson.firstName} ${linkedPerson.lastName}.`,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Person</DialogTitle>
          <DialogDescription>Create a guardian or child link for {currentPerson.firstName}.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person to Link</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a person" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {availablePeople.map(p => <SelectItem key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship to {currentPerson.firstName}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a relationship" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="guardian">Is a Guardian of {currentPerson.firstName}</SelectItem>
                      <SelectItem value="child">Is a Child of {currentPerson.firstName}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create Link</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function PersonDetailsPage({ params }: { params: { personId: string } }) {
  const person = mockPeople.find(p => p.personId === params.personId);

  const [links, setLinks] = React.useState(mockParentChildLinks);

  if (!person) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold">Person not found</h2>
        <p className="text-muted-foreground">The person you are looking for does not exist.</p>
        <Button asChild className="mt-4">
          <Link href="/players"><ArrowLeft className="mr-2" /> Back to People</Link>
        </Button>
      </div>
    );
  }

  const guardians = links
    .filter(link => link.childId === person.personId)
    .map(link => mockPeople.find(p => p.personId === link.parentId))
    .filter((p): p is Person => !!p);

  const children = links
    .filter(link => link.parentId === person.personId)
    .map(link => mockPeople.find(p => p.personId === link.childId))
    .filter((p): p is Person => !!p);

  const handleLinkAdded = (link: { person: Person, relationship: 'guardian' | 'child' }) => {
    if (link.relationship === 'guardian') {
      // The linked person is the guardian of the current person
      setLinks(prev => [...prev, { parentId: link.person.personId, childId: person.personId }]);
    } else {
      // The linked person is the child of the current person
      setLinks(prev => [...prev, { parentId: person.personId, childId: link.person.personId }]);
    }
  };


  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/players" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to People
        </Link>
        <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
                <AvatarImage src={person.profileImageUrl} />
                <AvatarFallback className="text-3xl">
                    {person.firstName?.[0]}{person.lastName?.[0]}
                </AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{person.firstName} {person.lastName}</h1>
                <p className="text-muted-foreground">{person.email}</p>
                <div className="flex gap-2 mt-2">
                    {person.roles.map(role => <Badge key={role} variant="secondary">{role}</Badge>)}
                </div>
            </div>
        </div>
      </header>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Family Links</CardTitle>
                <CardDescription>Guardians and children linked to this person.</CardDescription>
            </div>
            <AddLinkDialog currentPerson={person} onLinkAdded={handleLinkAdded} />
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
            <div>
                <h3 className="text-lg font-medium mb-2">Guardians</h3>
                <Table>
                    <TableBody>
                        {guardians.length > 0 ? guardians.map(g => (
                            <TableRow key={g.personId}>
                                <TableCell>
                                    <Link href={`/players/${g.personId}`} className="hover:underline">{g.firstName} {g.lastName}</Link>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell className="text-center text-muted-foreground">No guardians linked.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             <div>
                <h3 className="text-lg font-medium mb-2">Children</h3>
                <Table>
                    <TableBody>
                        {children.length > 0 ? children.map(c => (
                            <TableRow key={c.personId}>
                                <TableCell>
                                    <Link href={`/players/${c.personId}`} className="hover:underline">{c.firstName} {c.lastName}</Link>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell className="text-center text-muted-foreground">No children linked.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
