

'use client';

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, MoreHorizontal, Edit, Trash2, Facebook, Twitter, Youtube, Instagram } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { School } from "@/lib/data";
import { addSchoolAction, updateSchoolAction, deleteSchoolAction } from '@/lib/actions/schools';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const CURRENT_YEAR = new Date().getFullYear();

const schoolSchema = z.object({
  name: z.string().min(1, { message: "School name is required." }),
  abbreviation: z.string().optional(),
  motto: z.string().optional(),
  establishmentYear: z.coerce.number().int().min(1000).max(CURRENT_YEAR).optional().or(z.literal('')),
  principal: z.string().optional(),
  socialMedia: z.object({
    facebook: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
    twitter: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
    instagram: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
    youtube: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  }).optional(),
  logoUrl: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal('')),
  website: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  brandColors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
  }).optional(),
});


type SchoolFormValues = z.infer<typeof schoolSchema>;

function SchoolDialog({ mode, school, open, onOpenChange }: { mode: 'add' | 'edit', school?: School, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: mode === 'edit' && school ? { ...school } : {
        name: "", abbreviation: "", logoUrl: "", website: "", phone: "", location: "",
        motto: "", principal: "", socialMedia: {}, establishmentYear: undefined,
        brandColors: { primary: '#000000', secondary: '#ffffff' }
    },
  });

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && school) {
        form.reset({
            ...school,
            establishmentYear: school.establishmentYear || '',
        });
      } else {
        form.reset({
            name: "", abbreviation: "", logoUrl: "", website: "", phone: "", location: "",
            motto: "", principal: "", socialMedia: { facebook: '', twitter: '', instagram: '', youtube: ''}, establishmentYear: '',
            brandColors: { primary: '#000000', secondary: '#ffffff' }
        });
      }
    }
  }, [school, mode, open, form]);

  function onSubmit(data: SchoolFormValues) {
    startTransition(async () => {
      try {
        if (mode === 'edit' && school) {
          await updateSchoolAction({ schoolId: school.schoolId, ...data });
          toast({ title: "School Updated", description: `${data.name} has been successfully updated.` });
        } else {
          await addSchoolAction(data);
          toast({ title: "School Added", description: `${data.name} has been successfully created.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not save school.", variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit School' : 'Add New School'}</DialogTitle>
          <DialogDescription>Enter the school's details across the tabs below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
              </TabsList>
              <div className="p-1">
                <TabsContent value="general" className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>School Name</FormLabel><FormControl><Input placeholder="e.g. Greenwood High" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="abbreviation" render={({ field }) => (<FormItem><FormLabel>Abbreviation (Optional)</FormLabel><FormControl><Input placeholder="e.g. GHS" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="principal" render={({ field }) => (<FormItem><FormLabel>Principal / Headmaster (Optional)</FormLabel><FormControl><Input placeholder="e.g. Mr. John Smith" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="establishmentYear" render={({ field }) => (<FormItem><FormLabel>Year Established (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g. 1955" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                </TabsContent>
                <TabsContent value="contact" className="space-y-4">
                    <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location / Address</FormLabel><FormControl><Input placeholder="e.g. 123 Academy Lane, Knowledgeton" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g. +27 31 123 4567" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Website URL</FormLabel><FormControl><Input placeholder="e.g. https://www.school.com" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <Separator />
                    <h4 className="font-medium text-sm">Social Media (Optional)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="socialMedia.facebook" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Facebook className="mr-2"/>Facebook</FormLabel><FormControl><Input placeholder="https://facebook.com/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="socialMedia.twitter" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Twitter className="mr-2"/>Twitter / X</FormLabel><FormControl><Input placeholder="https://x.com/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="socialMedia.instagram" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Instagram className="mr-2"/>Instagram</FormLabel><FormControl><Input placeholder="https://instagram.com/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="socialMedia.youtube" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Youtube className="mr-2"/>YouTube</FormLabel><FormControl><Input placeholder="https://youtube.com/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </TabsContent>
                <TabsContent value="branding" className="space-y-4">
                  <FormField control={form.control} name="motto" render={({ field }) => (<FormItem><FormLabel>Motto / Tagline (Optional)</FormLabel><FormControl><Input placeholder="e.g. Striving for Excellence" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input placeholder="https://..." {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="brandColors.primary" render={({ field }) => (<FormItem><FormLabel>Primary Color</FormLabel><FormControl><Input type="color" {...field} value={field.value ?? ''} disabled={isPending} className="p-1 h-10" /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="brandColors.secondary" render={({ field }) => (<FormItem><FormLabel>Secondary Color</FormLabel><FormControl><Input type="color" {...field} value={field.value ?? ''} disabled={isPending} className="p-1 h-10" /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save School"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


export default function SchoolsClient({ schools, isAdmin }: { schools: School[], isAdmin: boolean }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  
  const [selectedSchool, setSelectedSchool] = React.useState<School | null>(null);
  const [isSchoolDialogOpen, setIsSchoolDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleDelete = () => {
    if (!selectedSchool) return;
    startTransition(async () => {
      try {
        await deleteSchoolAction(selectedSchool.schoolId);
        toast({
          title: "School Deleted",
          description: `${selectedSchool.name} has been deleted.`,
        });
        setIsDeleteDialogOpen(false);
        setSelectedSchool(null);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Could not delete school.",
          variant: "destructive",
        });
        setIsDeleteDialogOpen(false);
        setSelectedSchool(null);
      }
    });
  };

  return (
    <>
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
          {isAdmin && <Button onClick={() => { setDialogMode('add'); setSelectedSchool(null); setIsSchoolDialogOpen(true); }}><PlusCircle className="mr-2" />Add School</Button>}
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
                  <TableHead>Abbreviation</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.length > 0 ? (
                  schools.map((school) => (
                    <TableRow key={school.schoolId}>
                      <TableCell className="font-medium">
                        <Link href={`/schools/${school.schoolId}`} className="hover:underline">
                          {school.name}
                        </Link>
                      </TableCell>
                      <TableCell>{school.abbreviation}</TableCell>
                      {isAdmin && <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                setSelectedSchool(school);
                                setDialogMode('edit');
                                setIsSchoolDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setSelectedSchool(school);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 3 : 2} className="h-24 text-center">
                      No schools found. Get started by adding a school.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <SchoolDialog
          mode={dialogMode}
          school={selectedSchool ?? undefined}
          open={isSchoolDialogOpen}
          onOpenChange={setIsSchoolDialogOpen}
        />
      )}
      
      {isAdmin && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete <strong>{selectedSchool?.name}</strong>. 
              Any teams associated with this school will not be deleted and will need to be updated manually.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSchool(null)} disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={buttonVariants({ variant: "destructive" })}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete School"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  );
}
