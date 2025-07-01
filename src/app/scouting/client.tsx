
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { runScoutingReportAction } from '@/lib/actions/analysis';
import type { ScoutingReportOutput } from '@/ai/schemas';
import { Loader2, Upload, CheckCircle, AlertTriangle, User, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const scoutingSchema = z.object({
    playerName: z.string().min(1, { message: "Player name is required." }),
    skill: z.enum(['Batting', 'Bowling'], { required_error: "You must select a skill to analyze." }),
    photo: z.any().refine(fileList => fileList.length === 1, "Player photo is required."),
});

type ScoutingFormValues = z.infer<typeof scoutingSchema>;

export default function ScoutingClient() {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<ScoutingReportOutput | null>(null);

    const form = useForm<ScoutingFormValues>({
        resolver: zodResolver(scoutingSchema),
    });

    const photoRef = form.register("photo");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setResult(null); // Clear previous results
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = (data: ScoutingFormValues) => {
        const file = data.photo[0];
        if (!file) {
            toast({ title: "No Image Selected", description: "Please select an image file to analyze.", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                try {
                    const report = await runScoutingReportAction({
                        photoDataUri: base64data,
                        playerName: data.playerName,
                        skill: data.skill,
                    });
                    setResult(report);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
                    toast({ title: "Analysis Failed", description: errorMessage, variant: "destructive" });
                }
            };
            reader.onerror = () => {
                toast({ title: "Error Reading File", description: "Could not read the selected file.", variant: "destructive" });
            };
        });
    };

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Scouting Assistant</h1>
                <p className="text-muted-foreground">Upload a photo to get an AI-powered technical analysis of a player.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 <Card>
                    <CardHeader>
                        <CardTitle>Player Details</CardTitle>
                        <CardDescription>Provide a photo and some basic information for the analysis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="aspect-video w-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                                   {imagePreview ? (
                                        <Image src={imagePreview} alt="Player preview" width={600} height={400} className="object-contain h-full w-full" />
                                   ) : (
                                        <div className="text-center text-muted-foreground p-8">
                                            <Upload className="h-12 w-12 mx-auto mb-4"/>
                                            <p>Upload a player photo</p>
                                        </div>
                                   )}
                                </div>
                                <FormField control={form.control} name="photo" render={() => (
                                    <FormItem>
                                        <FormLabel>Player Photo</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="file" 
                                                accept="image/*"
                                                {...photoRef}
                                                onChange={handleFileChange}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="playerName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Player's Full Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., Ben Stokes" {...field} disabled={isPending} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="skill" render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Skill to Analyze</FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="Batting" /></FormControl>
                                                    <FormLabel className="font-normal">Batting</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="Bowling" /></FormControl>
                                                    <FormLabel className="font-normal">Bowling</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>

                                <Button type="submit" disabled={isPending} className="w-full">
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isPending ? 'Analyzing Technique...' : 'Get Scouting Report'}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card className={cn('sticky top-24', result || isPending ? '' : 'flex items-center justify-center')}>
                    {isPending && (
                        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="mt-4 text-lg font-semibold text-muted-foreground">AI Scout is analyzing...</p>
                        </div>
                    )}
                    {!isPending && !result && (
                        <div className="text-center text-muted-foreground p-8 min-h-[400px]">
                             <h2 className="text-xl font-semibold text-foreground mb-2">Scouting Report</h2>
                             <p>Submit a player's details to see the AI analysis here.</p>
                        </div>
                    )}
                    {!isPending && result && (
                        <>
                            <CardHeader>
                                <CardTitle>Scouting Report: {form.getValues('playerName')}</CardTitle>
                                <CardDescription>{result.summary}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><CheckCircle className="text-green-500"/>Strengths</h3>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        {result.strengths.map((item, index) => <li key={index}>{item}</li>)}
                                    </ul>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><AlertTriangle className="text-yellow-500"/>Areas for Improvement</h3>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        {result.areasForImprovement.map((item, index) => <li key={index}>{item}</li>)}
                                    </ul>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><User className="text-blue-500"/>Professional Comparison</h3>
                                    <p className="text-muted-foreground">{result.professionalComparison}</p>
                                </div>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
