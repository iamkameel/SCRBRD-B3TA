
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
import { updatePlayerAction, updateNotificationPreferencesAction, saveFcmTokenAction, removeFcmTokenAction } from '@/lib/actions/players';
import { getFcmToken } from "@/lib/fcm";

const profileSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const FCM_TOKEN_KEY = 'fcm_token';

export default function SettingsClient({ userProfile }: { userProfile: Person | null }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [isNotificationPending, startNotificationTransition] = React.useTransition();

  const [emailNotifications, setEmailNotifications] = React.useState(userProfile?.notificationPreferences?.email ?? false);
  const [pushNotifications, setPushNotifications] = React.useState(userProfile?.notificationPreferences?.push ?? false);
  
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

  const handleEmailNotificationChange = (value: boolean) => {
    if (!userProfile) return;
    setEmailNotifications(value);
    startNotificationTransition(async () => {
      try {
        await updateNotificationPreferencesAction(userProfile.personId, { email: value });
        toast({ title: "Settings Saved", description: "Your email notification preferences have been updated." });
      } catch (error) {
        setEmailNotifications(!value);
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not update preferences.", variant: "destructive" });
      }
    });
  };
  
  const handlePushNotificationChange = (enabled: boolean) => {
    if (!userProfile) return;

    startNotificationTransition(async () => {
        if (enabled) {
            try {
                const token = await getFcmToken();
                if (token) {
                    await saveFcmTokenAction(token);
                    await updateNotificationPreferencesAction(userProfile.personId, { push: true });
                    localStorage.setItem(FCM_TOKEN_KEY, token);
                    setPushNotifications(true);
                    toast({ title: "Push Notifications Enabled" });
                } else {
                    toast({ title: "Permission Required", description: "You need to grant permission to receive push notifications.", variant: "destructive" });
                    setPushNotifications(false);
                }
            } catch (error) {
                toast({ title: "Error", description: "Could not enable push notifications.", variant: "destructive" });
                setPushNotifications(false);
            }
        } else {
            try {
                const token = localStorage.getItem(FCM_TOKEN_KEY);
                if (token) {
                    await removeFcmTokenAction(token);
                    localStorage.removeItem(FCM_TOKEN_KEY);
                }
                await updateNotificationPreferencesAction(userProfile.personId, { push: false });
                setPushNotifications(false);
                toast({ title: "Push Notifications Disabled" });
            } catch (error) {
                toast({ title: "Error", description: "Could not disable push notifications.", variant: "destructive" });
            }
        }
    });
  };

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
                <Switch 
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={handleEmailNotificationChange}
                  disabled={isNotificationPending || !userProfile}
                />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get real-time alerts on your device.</p>
                </div>
                <Switch 
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={handlePushNotificationChange}
                  disabled={isNotificationPending || !userProfile}
                />
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
