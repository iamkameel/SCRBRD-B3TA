
'use client';

import * as React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { runUmpireReviewAction } from '@/lib/actions/analysis';
import type { UmpireDecisionOutput } from '@/ai/schemas';
import { AlertTriangle, CheckCircle, HelpCircle, Loader2, Video, ArrowRight, CornerUpLeft, CornerUpRight, Armchair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const reviewSchema = z.object({
  media: z.any().refine(fileList => fileList.length === 1, "A video or image file is required."),
  onFieldDecision: z.enum(['Out', 'Not Out'], { required_error: "On-field decision is required." }),
  bowlingAngle: z.enum(['Over the Wicket', 'Round the Wicket'], { required_error: "Bowling angle is required." }),
  bowlerHand: z.enum(['Left-arm', 'Right-arm'], { required_error: "Bowler's hand is required." }),
  batterHand: z.enum(['Left-hand', 'Right-hand'], { required_error: "Batter's hand is required." }),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;


const DecisionIcon = ({ decision }: { decision: string }) => {
    switch(decision) {
        case 'In-Line':
        case 'Hitting':
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        case "Umpire's Call":
            return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
        case 'Outside Leg':
        case 'Outside Off':
        case 'Missing':
        case 'Too High':
            return <HelpCircle className="h-5 w-5 text-red-500" />;
        default:
            return null;
    }
};

export default function UmpireReviewClient() {
    const { toast } = useToast();
    const [isPending, startTransition] = React.useTransition();
    const [mediaPreview, setMediaPreview] = React.useState<string | null>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [result, setResult] = React.useState<UmpireDecisionOutput | null>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
    });

    const mediaRef = form.register("media");

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type.startsWith('video/') && selectedFile.size > 8 * 1024 * 1024) { // 8MB limit for 8s video approx
                toast({ title: "File Too Large", description: "Please select a video file under 8MB.", variant: "destructive" });
                event.target.value = ''; // Clear the input
                return;
            }

            setFile(selectedFile);
            setResult(null); // Clear previous results
            const reader = new FileReader();
            reader.onloadend = () => {
                setMediaPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };
    
    // Check video duration
    React.useEffect(() => {
        if (file?.type.startsWith('video/') && videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
                if (videoRef.current && videoRef.current.duration > 8) {
                    toast({ title: "Video Too Long", description: "Please select a video clip up to 8 seconds long.", variant: "destructive" });
                    setFile(null);
                    setMediaPreview(null);
                    if(form.control._fields.media?._f.ref) {
                      (form.control._fields.media._f.ref as HTMLInputElement).value = '';
                    }
                }
            };
        }
    }, [file, form]);

    const onSubmit = (data: ReviewFormValues) => {
        if (!file) {
            toast({ title: "No Media Selected", description: "Please select an image or video file to review.", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                try {
                    const reviewResult = await runUmpireReviewAction({
                        mediaDataUri: base64data,
                        onFieldDecision: data.onFieldDecision,
                        bowlingAngle: data.bowlingAngle,
                        bowlerHand: data.bowlerHand,
                        batterHand: data.batterHand,
                    });
                    setResult(reviewResult);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
                    toast({ title: "Review Failed", description: errorMessage, variant: "destructive" });
                }
            };
            reader.onerror = () => {
                toast({ title: "Error Reading File", description: "Could not read the selected file.", variant: "destructive" });
            };
        });
    };

    const DecisionBadge = ({ decision }: { decision: string }) => {
        const baseClass = "text-base font-bold capitalize";
        switch (decision) {
            case 'Out': return <Badge variant="destructive" className={cn(baseClass, "bg-red-600 text-base")}>{decision}</Badge>;
            case 'Not Out': return <Badge variant="secondary" className={cn(baseClass, "bg-green-600 text-white text-base")}>{decision}</Badge>;
            default: return <Badge>{decision}</Badge>;
        }
    };
    
    const RadioCard = ({ field, value, label, icon: Icon }: { field: any, value: string, label: string, icon: React.ElementType }) => (
        <FormItem>
            <FormControl>
                <RadioGroupItem value={value} id={`${field.name}-${value}`} className="peer sr-only" />
            </FormControl>
            <FormLabel htmlFor={`${field.name}-${value}`} className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                <Icon className="mb-3 h-6 w-6" />
                {label}
            </FormLabel>
        </FormItem>
    );

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Umpire Review</h1>
                <p className="text-muted-foreground">Upload an image or video of an appeal to get a simulated third umpire decision.</p>
            </header>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                     <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>1. Upload Media</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="aspect-video w-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                                {mediaPreview ? (
                                    file?.type.startsWith('video/') ? (
                                        <video ref={videoRef} src={mediaPreview} controls className="object-contain h-full w-full" />
                                    ) : (
                                        <Image src={mediaPreview} alt="Appeal preview" width={600} height={400} className="object-contain h-full w-full" />
                                    )
                                ) : (
                                    <div className="text-center text-muted-foreground p-8"><Video className="h-12 w-12 mx-auto mb-4"/><p>Upload a video (max 8s) or image.</p></div>
                                )}
                                </div>
                                <FormField control={form.control} name="media" render={() => (
                                    <FormItem>
                                        <FormControl><Input type="file" accept="image/*,video/*" {...mediaRef} onChange={handleFileChange} disabled={isPending} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>2. Provide Context</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField control={form.control} name="onFieldDecision" render={({ field }) => (
                                    <FormItem><FormLabel>On-field Decision</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                                        <RadioCard field={field} value="Out" label="Out" icon={Armchair} />
                                        <RadioCard field={field} value="Not Out" label="Not Out" icon={Armchair} />
                                    </RadioGroup><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="bowlerHand" render={({ field }) => (
                                    <FormItem><FormLabel>Bowler's Hand</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                                         <RadioCard field={field} value="Right-arm" label="Right Arm" icon={CornerUpRight} />
                                         <RadioCard field={field} value="Left-arm" label="Left Arm" icon={CornerUpLeft} />
                                    </RadioGroup><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={form.control} name="batterHand" render={({ field }) => (
                                    <FormItem><FormLabel>Batter's Hand</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                                         <RadioCard field={field} value="Right-hand" label="Right Hand" icon={CornerUpRight} />
                                         <RadioCard field={field} value="Left-hand" label="Left Hand" icon={CornerUpLeft} />
                                    </RadioGroup><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="bowlingAngle" render={({ field }) => (
                                    <FormItem><FormLabel>Bowling Angle</FormLabel><RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4">
                                         <RadioCard field={field} value="Over the Wicket" label="Over the Wicket" icon={ArrowRight} />
                                         <RadioCard field={field} value="Round the Wicket" label="Round the Wicket" icon={ArrowRight} />
                                    </RadioGroup><FormMessage /></FormItem>
                                )}/>
                            </CardContent>
                        </Card>
                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isPending ? 'Analyzing...' : 'Review Decision'}
                        </Button>
                    </div>

                    <Card className={cn('sticky top-24', result || isPending ? '' : 'flex items-center justify-center')}>
                        {isPending && (<div className="flex flex-col items-center justify-center p-8 min-h-[400px]"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="mt-4 text-lg font-semibold text-muted-foreground">AI Umpire is reviewing...</p></div>)}
                        {!isPending && !result && (<div className="text-center text-muted-foreground p-8 min-h-[400px]"><h2 className="text-xl font-semibold text-foreground mb-2">Awaiting Review</h2><p>Submit details to see the AI analysis here.</p></div>)}
                        {!isPending && result && (
                            <>
                                <CardHeader className="text-center items-center">
                                    <CardTitle className="text-lg uppercase tracking-widest">Third Umpire Decision</CardTitle>
                                    <DecisionBadge decision={result.finalDecision} />
                                    <p className="text-sm font-semibold text-muted-foreground pt-2">{result.drsOutcome}</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center p-3 border rounded-lg">
                                            <h3 className="font-semibold">Pitching</h3><div className="flex items-center gap-2"><DecisionIcon decision={result.pitching} /><span className="font-medium">{result.pitching}</span></div>
                                        </div>
                                        <div className="flex justify-between items-center p-3 border rounded-lg">
                                            <h3 className="font-semibold">Impact</h3><div className="flex items-center gap-2"><DecisionIcon decision={result.impact} /><span className="font-medium">{result.impact}</span></div>
                                        </div>
                                        <div className="flex justify-between items-center p-3 border rounded-lg">
                                            <h3 className="font-semibold">Wickets</h3><div className="flex items-center gap-2"><DecisionIcon decision={result.wickets} /><span className="font-medium">{result.wickets}</span></div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div><h3 className="font-semibold mb-2">Justification</h3><p className="text-sm text-muted-foreground">{result.justification}</p></div>
                                </CardContent>
                            </>
                        )}
                    </Card>
                </form>
            </Form>
        </div>
    );
}
