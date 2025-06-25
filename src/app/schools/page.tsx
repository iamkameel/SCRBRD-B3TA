
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

// Schema based on competitions.schools
const schoolSchema = z.object({
  name: z.string().min(1, { message: "School name is required." }),
});

type SchoolFormValues = z.infer<typeof schoolSchema>;

interface School {
  schoolId: string;
  name: string;
}

const initialSchools: School[] = [
    { schoolId: "school_1", name: "Greenwood High" },
    { schoolId: "school_2", name: "Oakdale Academy" },
    { schoolId: "school_3", name: "Riverbend School" },
];

function AddSchoolDialog({ onSchoolAdded }: { onSchoolAdded: (school: School) => void }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(data: SchoolFormValues) {
    const newSchool: School = {
      ...data,
      schoolId: `school_${new Date().getTime()}`, // Temporary unique ID
    };
    onSchoolAdded(newSchool);
    toast({
      title: "School Added",
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
          Add School
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New School</DialogTitle>
          <DialogDescription>
            Enter the details for the new school.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Greenwood High" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save School</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function SchoolsPage() {
  const [schools, setSchools] = React.useState<School[]>(initialSchools);

  const handleSchoolAdded = (newSchool: School) => {
    setSchools((prevSchools) => [...prevSchools, newSchool]);
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Schools
          </h1>
          <p className="text-muted-foreground">
            Manage your schools and educational institutions.
          </p>
        </div>
        <AddSchoolDialog onSchoolAdded={handleSchoolAdded} />
      </header>
      <Card>
        <CardHeader>
          <CardTitle>School List</CardTitle>
          <CardDescription>A list of all schools in the system.</CardDescription>
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
              {schools.length > 0 ? (
                schools.map((school) => (
                  <TableRow key={school.schoolId}>
                    <TableCell className="font-medium">{school.name}</TableCell>
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
                    No schools found. Get started by adding a school.
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
