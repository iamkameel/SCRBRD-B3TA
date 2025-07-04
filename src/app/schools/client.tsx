

'use client';

import * as React from "react";
import Link from "next/link";
import { PlusCircle, MoreHorizontal, Edit, Trash2 } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import type { School } from "@/lib/data";
import { deleteSchoolAction } from '@/lib/actions/schools';
import { SchoolDialog } from "./school-dialog";

export default function SchoolsClient({ schools, canManage }: { schools: School[], canManage: boolean }) {
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
          {canManage && <Button onClick={() => { setDialogMode('add'); setSelectedSchool(null); setIsSchoolDialogOpen(true); }}><PlusCircle className="mr-2" />Add School</Button>}
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
                  {canManage && <TableHead className="text-right">Actions</TableHead>}
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
                      {canManage && <TableCell className="text-right">
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
                    <TableCell colSpan={canManage ? 3 : 2} className="h-24 text-center">
                      No schools found. Get started by adding a school.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {canManage && (
        <SchoolDialog
          mode={dialogMode}
          school={selectedSchool ?? undefined}
          open={isSchoolDialogOpen}
          onOpenChange={setIsSchoolDialogOpen}
        />
      )}
      
      {canManage && <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
