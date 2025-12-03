'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Check, Search, User, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import type { Person } from "@/lib/data";
import { updatePlayerAction } from '@/lib/actions/players';
import { ROLE_GROUPS } from "@/lib/roles";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const roleUpdateSchema = z.object({
  personId: z.string(),
  roles: z.array(z.string()).refine((value) => value.length > 0, "At least one role must be selected."),
  activeRole: z.string().optional(),
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

export function UserRoleDialog({ users, currentUser, open, onOpenChange }: { users: Person[], currentUser: Person | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedUser, setSelectedUser] = React.useState<Person | null>(null);

  const form = useForm<z.infer<typeof roleUpdateSchema>>({
    resolver: zodResolver(roleUpdateSchema),
  });
  
  const selectedRoles = form.watch('roles');

  const filteredUsers = React.useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user =>
      `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleUserSelect = (user: Person) => {
    setSelectedUser(user);
    form.reset({
      personId: user.personId,
      roles: user.roles || [],
      activeRole: user.activeRole || (user.roles.length > 0 ? user.roles[0] : undefined),
    });
  };

  const handleBack = () => {
    setSelectedUser(null);
    setSearchTerm('');
    form.reset();
  };
  
  React.useEffect(() => {
      if(!open) {
          handleBack();
      }
  }, [open]);

  const onSubmit = (data: z.infer<typeof roleUpdateSchema>) => {
    startTransition(async () => {
      if (!selectedUser) return;
      
      const fullUpdateData = {
          ...selectedUser,
          roles: data.roles,
          activeRole: data.activeRole || data.roles[0],
      };

      try {
        await updatePlayerAction(fullUpdateData);
        toast({ title: "Roles Updated", description: `Roles for ${selectedUser.firstName} ${selectedUser.lastName} have been saved.` });
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update roles.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {!selectedUser ? (
          <>
            <DialogHeader>
              <DialogTitle>Manage User Roles</DialogTitle>
              <DialogDescription>Select a user to modify their roles and permissions.</DialogDescription>
            </DialogHeader>
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search for a user..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <ScrollArea className="h-96">
                <div className="space-y-2 p-1">
                    {filteredUsers.map(user => (
                        <button key={user.personId} onClick={() => handleUserSelect(user)} className="w-full text-left p-2 rounded-md hover:bg-muted flex items-center gap-3">
                             <Avatar><AvatarImage src={user.profileImageUrl} /><AvatarFallback>{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback></Avatar>
                             <div>
                                <p className="font-medium">{user.firstName} {user.lastName}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                             </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
          </>
        ) : (
          <>
            <DialogHeader>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleBack}><ArrowLeft className="h-4 w-4" /></Button>
                    <DialogTitle>Roles for {selectedUser.firstName}</DialogTitle>
                </div>
              <DialogDescription>Assign roles and set the primary active role for this user.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="roles"
                    render={() => (
                        <FormItem>
                        {ROLE_GROUPS.map((group) => (
                            <div key={group.group}>
                            <h4 className="font-medium text-sm text-muted-foreground mb-2 mt-4">{group.group}</h4>
                            <div className="grid grid-cols-2 gap-2 border p-4 rounded-md">
                                {group.roles.map((item) => {
                                const isSystemRole = item.id === 'Admin' || item.id === 'System Architect';
                                const isDisabled = isSystemRole && !(currentUser?.roles.includes('System Architect'));
                                return (
                                    <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="roles"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                            checked={field.value?.includes(item.id)}
                                            onCheckedChange={(checked) => {
                                                const newRoles = checked
                                                ? [...(field.value || []), item.id]
                                                : (field.value || []).filter((v) => v !== item.id);
                                                field.onChange(newRoles);
                                                if (newRoles && !newRoles.includes(form.getValues('activeRole') || '')) { form.setValue('activeRole', newRoles[0]); }
                                            }}
                                            disabled={isDisabled || isPending}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">{item.label}</FormLabel>
                                        </FormItem>
                                    )}
                                    />
                                );
                                })}
                            </div>
                            </div>
                        ))}
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="activeRole"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Active Role</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isPending || !selectedRoles || selectedRoles.length === 0}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select an active role" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {selectedRoles?.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleBack}>Cancel</Button>
                  <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Roles"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
