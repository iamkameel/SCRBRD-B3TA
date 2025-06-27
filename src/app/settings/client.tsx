'use client';

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Switch } from "@/components/ui/switch";

export default function SettingsClient() {
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
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>
            Update your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Your Name" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="your.email@example.com" disabled />
          </div>
           <Button disabled>Update Profile</Button>
        </CardContent>
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
