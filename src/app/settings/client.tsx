'use client';

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
            <CardTitle>Theme</CardTitle>
            <CardDescription>
                Select your preferred theme. (This is a placeholder for now).
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button disabled>Switch to Dark Mode</Button>
        </CardContent>
      </Card>
    </div>
  );
}
