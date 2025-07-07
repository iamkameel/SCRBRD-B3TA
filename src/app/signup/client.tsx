
'use client';

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Logo } from '@/components/icons/logo';
import { signupUserAction, type SignupActionInput } from '@/lib/actions/signup';
import type { School, Team, Division, Person } from '@/lib/data';
import { Building, UserCog, User, Heart, Eye, ArrowLeft, Loader2 } from 'lucide-react';

const roles = [
  { id: 'School Admin', title: 'School Admin', description: 'Manage your school’s teams & staff.', icon: Building },
  { id: 'Coach', title: 'Coach', description: 'Manage a team roster & training.', icon: UserCog },
  { id: 'Player', title: 'Player', description: 'Join a team & track your stats.', icon: User },
  { id: 'Guardian', title: 'Parent/Guardian', description: 'Follow your child’s schedule.', icon: Heart },
  { id: 'Spectator', title: 'Spectator', description: 'Follow your favorite teams.', icon: Eye },
];

const baseSignupSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const formSchema = z.object({
  role: z.string(),
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
  // Role specific fields
  schoolName: z.string().optional(),
  schoolId: z.string().optional(),
  divisionId: z.string().optional(),
  inviteCode: z.string().optional(),
  playerId: z.string().optional(),
});

type SignupFormValues = z.infer<typeof formSchema>;

interface SignupClientProps {
    schools: School[];
    teams: Team[];
    divisions: Division[];
    players: Person[];
}

export default function SignupClient({ schools, teams, divisions, players }: SignupClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [selectedRole, setSelectedRole] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [signupResult, setSignupResult] = React.useState<{ status: string } | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { role: '', firstName: '', lastName: '', email: '', password: '' },
  });
  
  const currentRole = form.watch('role');

  const handleRoleSelect = (roleId: string) => {
    form.setValue('role', roleId);
    setSelectedRole(roleId);
    setStep(2);
  };
  
  const handleBack = () => {
    setStep(step - 1);
  }

  const onSubmit = (data: SignupFormValues) => {
    startTransition(async () => {
      try {
        const result = await signupUserAction(data as SignupActionInput);
        setSignupResult({ status: result.status });
        setStep(3);
      } catch (error: any) {
        let description = "An unexpected error occurred. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
            description = "This email is already in use. Please try logging in."
        }
        toast({ title: "Sign Up Failed", description, variant: "destructive" });
      }
    });
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <CardHeader className="text-center items-center">
              <Logo />
              <CardTitle className="text-2xl pt-4">Join SCRBRD</CardTitle>
              <CardDescription>First, tell us who you are.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className="p-4 border rounded-lg text-left hover:bg-muted/50 transition-colors flex items-start gap-4"
                >
                  <role.icon className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold">{role.title}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </>
        );
      case 2:
        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8"><ArrowLeft/></Button>
                    <div>
                        <CardTitle className="text-2xl">Create Your Account</CardTitle>
                        <CardDescription>Signing up as a {selectedRole}.</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="m@example.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="password" render={({ field }) => (<FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />

                {currentRole === 'School Admin' && (
                    <FormField control={form.control} name="schoolName" render={({ field }) => (<FormItem><FormLabel>Your School's Full Name</FormLabel><FormControl><Input placeholder="e.g. Greenwood High School" {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}
                {(currentRole === 'Coach' || currentRole === 'Player') && (
                    <>
                        <FormField control={form.control} name="schoolId" render={({ field }) => (<FormItem><FormLabel>School</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select your school" /></SelectTrigger></FormControl><SelectContent>{schools.map(s => <SelectItem key={s.schoolId} value={s.schoolId}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                        {currentRole === 'Player' && <FormField control={form.control} name="divisionId" render={({ field }) => (<FormItem><FormLabel>Age Division</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select your age division" /></SelectTrigger></FormControl><SelectContent>{divisions.map(d => <SelectItem key={d.divisionId} value={d.divisionId}>{d.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />}
                        {currentRole === 'Coach' && <FormField control={form.control} name="inviteCode" render={({ field }) => (<FormItem><FormLabel>Coach Invite Code</FormLabel><FormControl><Input placeholder="Enter code from your admin" {...field} /></FormControl><FormMessage /></FormItem>)} />}
                    </>
                )}
                {currentRole === 'Guardian' && (
                    <FormField control={form.control} name="playerId" render={({ field }) => (<FormItem><FormLabel>Child's Name</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select your child" /></SelectTrigger></FormControl><SelectContent>{players.map(p => <SelectItem key={p.personId} value={p.personId}>{`${p.firstName} ${p.lastName}`}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                )}
                 <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isPending ? "Creating Account..." : "Create Account"}
                </Button>
              </CardContent>
            </form>
          </Form>
        );
      case 3:
        return (
             <>
                <CardHeader className="text-center items-center">
                  <Logo />
                  <CardTitle className="text-2xl pt-4">
                    {signupResult?.status === 'active' ? 'Welcome to SCRBRD!' : 'Request Submitted!'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  {signupResult?.status === 'active' ? (
                      <p className="text-muted-foreground">Your account has been created and you are now logged in. Let's get started!</p>
                  ) : (
                       <p className="text-muted-foreground">Your registration requires manual approval from an administrator. You will receive an email once your account has been reviewed.</p>
                  )}
                  <Button asChild className="w-full">
                      <Link href="/dashboard">
                          {signupResult?.status === 'active' ? 'Go to Dashboard' : 'Back to Home'}
                      </Link>
                  </Button>
                </CardContent>
            </>
        );
      default:
        return null;
    }
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
      <Card className="w-full max-w-lg bg-card/80 backdrop-blur-sm">
        <AnimatePresence mode="wait">
            <motion.div
                key={step}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
            >
                {renderStepContent()}
            </motion.div>
        </AnimatePresence>
        {step !== 1 && (
            <div className="mt-4 text-center text-sm p-6 pt-0">
                Already have an account?{" "}
                <Link href="/login" className="underline">
                Sign in
                </Link>
            </div>
        )}
      </Card>
    </div>
  );
}
