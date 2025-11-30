
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Person, School } from "@/lib/data";
import { addPlayerAction, updatePlayerAction } from '@/lib/actions/players';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_GROUPS } from "@/lib/roles";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";


const personSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  displayName: z.string().optional(),
  dateOfBirth: z.date().optional(),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
  profileImageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  roles: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one role.",
  }),
  assignedSchoolId: z.string().optional(),
  activeRole: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    relation: z.string().optional(),
    phone: z.string().optional(),
  }).optional(),
  physicalAttributes: z.object({
    heightCm: z.coerce.number().optional(),
    weightKg: z.coerce.number().optional(),
    battingHand: z.enum(['Left', 'Right']).optional(),
    bowlingHand: z.enum(['Left', 'Right']).optional(),
    bowlingStyles: z.array(z.string()).optional(),
  }).optional(),
  biography: z.string().optional(),
  qualifications: z.array(z.string()).optional(),
}).refine(data => {
    if (data.roles && data.roles.length > 0 && !data.activeRole) {
        return false;
    }
    if (data.activeRole && !data.roles.includes(data.activeRole)) {
        return false;
    }
    return true;
}, {
    message: "An active role must be selected from the assigned roles.",
    path: ["activeRole"],
});

type PersonFormValues = z.infer<typeof personSchema>;
const BATTING_HANDS = ['Right', 'Left'] as const;
const BOWLING_HANDS = ['Right', 'Left'] as const;

export function PersonDialog({ mode, person, currentUser, open, onOpenChange, schools }: { mode: 'add' | 'edit', person?: Person, currentUser: Person | null, open: boolean, onOpenChange: (open: boolean) => void, schools: School[] }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: mode === 'edit' && person ? {
      ...person,
      phone: person.phone ?? '',
      profileImageUrl: person.profileImageUrl ?? '',
      assignedSchoolId: person.assignedSchools?.[0] || undefined,
    } : {
      firstName: "", lastName: "", email: "", phone: "", profileImageUrl: "", roles: ["Player"], activeRole: "Player", assignedSchoolId: undefined,
    },
  });
  
  const selectedRoles = form.watch('roles');
  const hasPlayerRole = selectedRoles?.includes('Player');

  const canAssignRoles = currentUser?.roles.includes('Admin') || currentUser?.roles.includes('Sportsmaster') || currentUser?.roles.includes('System Architect');
  const isCurrentUserAdmin = (currentUser?.roles.includes('Admin') || currentUser?.roles.includes('System Architect')) ?? false;


  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && person) {
        form.reset({
          ...person,
          displayName: person.displayName || '',
          phone: person.phone || '',
          profileImageUrl: person.profileImageUrl || '',
          assignedSchoolId: person.assignedSchools?.[0] || undefined,
          qualifications: person.qualifications || [],
          physicalAttributes: person.physicalAttributes || {},
          biography: person.biography || '',
          emergencyContact: person.emergencyContact || { name: '', relation: '', phone: '' },
          dateOfBirth: person.dateOfBirth ? new Date(person.dateOfBirth) : undefined,
        });
      } else {
        form.reset({
          firstName: "", lastName: "", email: "", phone: "", profileImageUrl: "", roles: ["Player"], activeRole: "Player", assignedSchoolId: undefined, dateOfBirth: undefined,
          displayName: '', biography: '', qualifications: [],
          physicalAttributes: { battingHand: undefined, bowlingHand: undefined, bowlingStyles: [], heightCm: undefined, weightKg: undefined },
          emergencyContact: { name: '', relation: '', phone: '' },
        });
      }
    }
  }, [person, mode, open, form]);

  function onSubmit(data: PersonFormValues) {
    startTransition(async () => {
      try {
        const payload = { ...data, activeRole: data.activeRole || data.roles[0] };
        if (mode === 'edit' && person) {
          await updatePlayerAction({ personId: person.personId, ...payload });
          toast({ title: "Person Updated", description: `${data.firstName} ${data.lastName} has been updated.` });
        } else {
          await addPlayerAction(payload);
          toast({ title: "Person Added", description: `${data.firstName} ${data.lastName} has been created.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : `Could not ${mode} person.`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === 'edit' ? 'Edit Person' : 'Add New Person'}</DialogTitle><DialogDescription>Use the tabs to enter the details for the person.</DialogDescription></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic-info" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="player-profile" disabled={!hasPlayerRole}>Player Profile</TabsTrigger>
                <TabsTrigger value="emergency">Emergency</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic-info" className="space-y-4 p-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>)} />
                  </div>
                   <FormField control={form.control} name="displayName" render={({ field }) => (<FormItem><FormLabel>Display Name (Optional)</FormLabel><FormControl><Input placeholder="e.g. JD" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="john.doe@example.com" {...field} disabled={isPending}/></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input placeholder="+1 234 567 890" {...field} value={field.value ?? ''} disabled={isPending}/></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="dateOfBirth" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Date of Birth</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")} disabled={isPending}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP") : (<span>Pick a date</span>)}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} captionLayout="dropdown-buttons" fromYear={1950} toYear={new Date().getFullYear()} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="profileImageUrl" render={({ field }) => (<FormItem><FormLabel>Profile Image URL (Optional)</FormLabel><FormDescription>Provide a URL or leave blank. You can generate an AI portrait later on the person's profile page.</FormDescription><FormControl><Input placeholder="https://..." {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              </TabsContent>
              
              <TabsContent value="roles" className="space-y-4 p-1">
                  <FormField control={form.control} name="assignedSchoolId" render={({ field }) => (
                    <FormItem><FormLabel>School Assignment</FormLabel><FormDescription>Assign this person to a primary school. This is required for most staff and player roles.</FormDescription><Select onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)} value={field.value ?? 'none'} disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a school" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">-- None --</SelectItem>{schools.map((school) => (<SelectItem key={school.schoolId} value={school.schoolId}>{school.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <Separator />
                  <FormField control={form.control} name="roles" render={() => (
                    <FormItem>
                      <FormLabel>Roles</FormLabel><FormDescription>Assign at least one role to this person.</FormDescription>
                      {!canAssignRoles && <p className="text-sm text-destructive">You do not have permission to assign roles.</p>}
                      <div className="space-y-4">
                        {ROLE_GROUPS.map((group) => (
                          <div key={group.group}>
                            <h4 className="font-medium text-sm text-muted-foreground mb-2">{group.group}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border p-4 rounded-md">
                              {group.roles.map((item) => {
                                const isAdminRole = item.id === 'Admin' || item.id === 'System Architect';
                                const isDisabled = isPending || !canAssignRoles || (isAdminRole && !isCurrentUserAdmin);
                                return (
                                <FormField key={item.id} control={form.control} name="roles" render={({ field }) => (
                                  <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                                        const newRoles = checked ? [...(field.value || []), item.id] : (field.value || []).filter((v) => v !== item.id);
                                        field.onChange(newRoles);
                                        if (newRoles && !newRoles.includes(form.getValues('activeRole') || '')) { form.setValue('activeRole', newRoles[0]); }
                                    }} disabled={isDisabled} /></FormControl>
                                    <FormLabel className="font-normal">{item.label}</FormLabel>
                                  </FormItem>
                                )} />
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="activeRole" render={({field}) => (<FormItem><FormLabel>Active Role</FormLabel><FormDescription>The primary role this user will have when they log in.</FormDescription><Select onValueChange={field.onChange} value={field.value} disabled={isPending || !selectedRoles || selectedRoles.length === 0}><FormControl><SelectTrigger><SelectValue placeholder="Select an active role"/></SelectTrigger></FormControl><SelectContent>{selectedRoles?.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)} />
              </TabsContent>
              
              <TabsContent value="player-profile" className="space-y-4 p-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="physicalAttributes.heightCm" render={({ field }) => (<FormItem><FormLabel>Height (cm)</FormLabel><FormControl><Input type="number" placeholder="180" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage/></FormItem>)} />
                    <FormField control={form.control} name="physicalAttributes.weightKg" render={({ field }) => (<FormItem><FormLabel>Weight (kg)</FormLabel><FormControl><Input type="number" placeholder="75" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage/></FormItem>)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="physicalAttributes.battingHand" render={({ field }) => (<FormItem><FormLabel>Batting Hand</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{BATTING_HANDS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)} />
                    <FormField control={form.control} name="physicalAttributes.bowlingHand" render={({ field }) => (<FormItem><FormLabel>Bowling Hand</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{BOWLING_HANDS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)} />
                  </div>
                   <FormField control={form.control} name="biography" render={({ field }) => (<FormItem><FormLabel>Biography</FormLabel><FormControl><Textarea placeholder="A short bio about the player..." {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                   <FormField control={form.control} name="qualifications" render={({ field }) => (<FormItem><FormLabel>Qualifications & Certifications</FormLabel><FormDescription>List one per line.</FormDescription><FormControl><Textarea placeholder="e.g., Level 2 Coaching Certificate&#10;First-Aid Certified" {...field} value={field.value?.join('\n') ?? ''} onChange={e => field.onChange(e.target.value.split('\n'))} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
              </TabsContent>

              <TabsContent value="emergency" className="space-y-4 p-1">
                  <FormField control={form.control} name="emergencyContact.name" render={({ field }) => (<FormItem><FormLabel>Contact Name</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="emergencyContact.relation" render={({ field }) => (<FormItem><FormLabel>Relation</FormLabel><FormControl><Input placeholder="e.g., Mother" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl></FormItem>)} />
                  <FormField control={form.control} name="emergencyContact.phone" render={({ field }) => (<FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input placeholder="+1 987 654 321" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl></FormItem>)} />
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Person"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
