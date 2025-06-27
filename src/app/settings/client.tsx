
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { Person } from '@/lib/data';
import { updatePlayerAction } from '@/lib/actions/players';

const profileSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsClient({ userProfile }: { userProfile: Person | null }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: userProfile?.firstName ?? "",
      lastName: userProfile?.lastName ?? "",
      email: userProfile?.email ?? "",
      phone: userProfile?.phone ?? "",
    },
  });

  function onSubmit(data: ProfileFormValues) {
    if (!userProfile) {
      toast({ title: "Error", description: "No user profile to update.", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      try {
        await updatePlayerAction({ 
          personId: userProfile.personId, 
          roles: userProfile.roles, // Pass existing roles
          profileImageUrl: userProfile.profileImageUrl, // Pass existing image URL
          ...data 
        });
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update profile.", variant: "destructive" });
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and application settings.
        </p>
      </header>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Update your personal information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {userProfile ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="Your First Name" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Your Last Name" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="your.email@example.com" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input placeholder="+123456789" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                  <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Update Profile"}</Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">User profile could not be loaded. Please ensure the sample data has been migrated.</p>
              )}
            </CardContent>
          </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
                Manage how you receive notifications from the app.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive updates about match changes and summaries via email.</p>
                </div>
                <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get real-time alerts on your device. (Coming soon)</p>
                </div>
                <Switch id="push-notifications" disabled/>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>
                Select your preferred theme for the application.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
