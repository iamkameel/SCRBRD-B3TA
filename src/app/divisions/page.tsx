
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

// Schema based on competitions.divisions
const divisionSchema = z.object({
  name: z.string().min(1, { message: "Division name is required." }),
});

type DivisionFormValues = z.infer<typeof divisionSchema>;

interface Division {
  divisionId: string;
  name: string;
}

const initialDivisions: Division[] = [
    { divisionId: "div_1", name: "U19 Varsity" },
    { divisionId: "div_2", name: "U17 Junior Varsity" },
    { divisionId: "div_3", name: "U15 Freshmen" },
];

function AddDivisionDialog({ onDivisionAdded }: { onDivisionAdded: (division: Division) => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<DivisionFormValues>({
    resolver: zodResolver(divisionSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(data: DivisionFormValues) {
    const newDivision: Division = {
      ...data,
      divisionId: `div_${new Date().getTime()}`, // Temporary unique ID
    };
    onDivisionAdded(newDivision);
    toast({
      title: "Division Added",
      description: `${data.name} has been successfully created.`,
    });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add Division
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Division</DialogTitle>
          <DialogDescription>
            Enter the details for the new division.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Division Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. U19 Varsity" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Division</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function DivisionsPage() {
  const [divisions, setDivisions] = React.useState<Division[]>(initialDivisions);

  const handleDivisionAdded = (newDivision: Division) => {
    setDivisions((prevDivisions) => [...prevDivisions, newDivision]);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Divisions
          </h1>
          <p className="text-muted-foreground">
            Manage your competition divisions.
          </p>
        </div>
        <AddDivisionDialog onDivisionAdded={handleDivisionAdded} />
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Division List</CardTitle>
          <CardDescription>A list of all divisions in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {divisions.length > 0 ? (
                divisions.map((division) => (
                  <TableRow key={division.divisionId}>
                    <TableCell className="font-medium">{division.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    No divisions found. Get started by adding a division.
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
