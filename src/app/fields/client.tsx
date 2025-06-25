'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import type { Field } from "@/lib/data";
import { addFieldAction } from '@/lib/actions/fields';

// Schema based on competitions.fields
const fieldSchema = z.object({
  name: z.string().min(1, { message: "Field name is required." }),
  surfaceType: z.string().optional(),
  facilities: z.string().optional(),
});

type FieldFormValues = z.infer<typeof fieldSchema>;

function AddFieldDialog() {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: "",
      surfaceType: "",
      facilities: "",
    },
  });

  function onSubmit(data: FieldFormValues) {
    startTransition(async () => {
      try {
        await addFieldAction(data);
        toast({
          title: "Field Added",
          description: `${data.name} has been successfully created.`,
        });
        setOpen(false);
        form.reset();
        router.refresh();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not add field.",
          variant: "destructive",
        })
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2" />
          Add Field
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Field</DialogTitle>
          <DialogDescription>
            Enter the details for the new field or venue.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Main Oval" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="surfaceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Surface Type (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Grass, Turf" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facilities (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g. Pavilion, Toilets, Nets" {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Field"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function FieldsClient({ fields }: { fields: Field[] }) {
  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Fields & Venues
          </h1>
          <p className="text-muted-foreground">
            Manage your sporting fields and venues.
          </p>
        </div>
        <AddFieldDialog />
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Field List</CardTitle>
          <CardDescription>A list of all fields in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Surface</TableHead>
                <TableHead>Facilities</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length > 0 ? (
                fields.map((field) => (
                  <TableRow key={field.fieldId}>
                    <TableCell className="font-medium">{field.name}</TableCell>
                    <TableCell>{field.surfaceType}</TableCell>
                    <TableCell>{field.facilities}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No fields found. Get started by adding a field.
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
