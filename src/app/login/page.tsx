

'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordResetEmailAction } from '@/lib/actions/auth';
import { Logo } from '@/components/icons/logo';

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  rememberMe: z.boolean().default(false).optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isResetting, startResetTransition] = React.useTransition();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = (data: LoginFormValues) => {
    startTransition(async () => {
      try {
        await setPersistence(auth, data.rememberMe ? browserLocalPersistence : browserSessionPersistence);
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({ title: "Login Successful", description: "Welcome back!" });
        router.push('/dashboard');
      } catch (error: any) {
        let description = "Invalid email or password. Please try again.";
        if (error.code === 'auth/user-not-found') {
            description = "No user found with this email. Please sign up first.";
        }
        if (error.code === 'auth/invalid-credential') {
          description = "The email or password you entered is incorrect. Please try again.";
        }
        toast({
          title: "Login Failed",
          description,
          variant: "destructive",
        });
      }
    });
  };

  const handlePasswordReset = () => {
    const email = form.getValues('email');
    if (!email) {
        toast({ title: "Email Required", description: "Please enter your email address to reset the password.", variant: "destructive" });
        return;
    }

    startResetTransition(async () => {
        try {
            await sendPasswordResetEmailAction(email);
            toast({ title: "Check Your Email", description: `A password reset link has been sent to ${email}.` });
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Could not send reset email.",
                variant: "destructive",
            });
        }
    });
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen">
      <Image
          src="https://maverickdesign.co.za/wp-content/uploads/2025/07/cricket-stadium_1.png"
          alt="Cricket stadium background"
          data-ai-hint="cricket stadium night"
          fill
          className="object-cover -z-10"
        />
       <div className="absolute inset-0 bg-black/60 -z-10" />
      <Card className="w-full max-w-md bg-black/20 backdrop-blur-lg border border-white/20 text-white">
        <CardHeader className="text-center items-center">
          <Logo />
          <CardTitle className="text-2xl pt-4">Welcome Back!</CardTitle>
          <CardDescription className="text-gray-300">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="m@example.com" {...field} disabled={isPending || isResetting} className="bg-white/10 border-white/20 placeholder:text-gray-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                     <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isPending || isResetting} className="bg-white/10 border-white/20 placeholder:text-gray-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-white/50"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Remember me
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                 <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm text-primary-foreground hover:text-primary-foreground/80"
                    onClick={handlePasswordReset}
                    disabled={isResetting || isPending}
                  >
                    Forgot Password?
                  </Button>
              </div>
              <Button type="submit" className="w-full" disabled={isPending || isResetting}>
                {isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-gray-300">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline hover:text-white">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
