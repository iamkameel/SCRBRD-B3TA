
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { runUmpireReviewAction } from '@/lib/actions/analysis';
import type { UmpireDecisionOutput } from '@/ai/schemas';
import { AlertCircle, CheckCircle, HelpCircle, Loader2, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

const DecisionIcon = ({ decision }: { decision: string }) => {
    switch(decision) {
        case 'In-Line':
        case 'Hitting':
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        case "Umpire's Call":
            return <AlertCircle className="h-5 w-5 text-yellow-500" />;
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
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [file, setFile] = React.useState<File | null>(null);
    const [result, setResult] = React.useState<UmpireDecisionOutput | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null); // Clear previous results
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleReview = () => {
        if (!file) {
            toast({ title: "No Image Selected", description: "Please select an image file to review.", variant: "destructive" });
            return;
        }

        startTransition(async () => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                try {
                    const reviewResult = await runUmpireReviewAction({ photoDataUri: base64data });
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
            case 'Out': return <Badge variant="destructive" className={cn(baseClass, "bg-red-600")}>{decision}</Badge>;
            case 'Not Out': return <Badge variant="secondary" className={cn(baseClass, "bg-green-600 text-white")}>{decision}</Badge>;
            case "Umpire's Call": return <Badge variant="secondary" className={cn(baseClass, "bg-yellow-500 text-black")}>{decision}</Badge>;
            default: return <Badge>{decision}</Badge>;
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">AI Umpire Review</h1>
                <p className="text-muted-foreground">Upload an image of an appeal to get a simulated third umpire decision.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 <Card>
                    <CardHeader>
                        <CardTitle>Upload Appeal Image</CardTitle>
                        <CardDescription>Select an image of the moment of impact for an LBW appeal.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="aspect-video w-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
                           {imagePreview ? (
                                <Image src={imagePreview} alt="Appeal preview" width={600} height={400} className="object-contain h-full w-full" />
                           ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    <Video className="h-12 w-12 mx-auto mb-4"/>
                                    <p>Image preview will appear here.</p>
                                </div>
                           )}
                        </div>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="picture">Select Image</Label>
                            <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} disabled={isPending} />
                        </div>
                        <Button onClick={handleReview} disabled={isPending || !file} className="w-full">
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isPending ? 'Analyzing...' : 'Review Decision'}
                        </Button>
                    </CardContent>
                </Card>

                <Card className={cn('sticky top-24', result || isPending ? '' : 'flex items-center justify-center')}>
                    {isPending && (
                        <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="mt-4 text-lg font-semibold text-muted-foreground">AI Umpire is reviewing...</p>
                        </div>
                    )}
                    {!isPending && !result && (
                        <div className="text-center text-muted-foreground p-8 min-h-[400px]">
                             <h2 className="text-xl font-semibold text-foreground mb-2">Awaiting Review</h2>
                             <p>Upload an image and click "Review Decision" to see the AI analysis here.</p>
                        </div>
                    )}
                    {!isPending && result && (
                        <>
                            <CardHeader className="text-center items-center">
                                <CardTitle className="text-lg uppercase tracking-widest">Third Umpire</CardTitle>
                                <DecisionBadge decision={result.decision} />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                        <h3 className="font-semibold">Pitching</h3>
                                        <div className="flex items-center gap-2">
                                            <DecisionIcon decision={result.pitching} />
                                            <span className="font-medium">{result.pitching}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                        <h3 className="font-semibold">Impact</h3>
                                        <div className="flex items-center gap-2">
                                            <DecisionIcon decision={result.impact} />
                                            <span className="font-medium">{result.impact}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-3 border rounded-lg">
                                        <h3 className="font-semibold">Wickets</h3>
                                        <div className="flex items-center gap-2">
                                            <DecisionIcon decision={result.wickets} />
                                            <span className="font-medium">{result.wickets}</span>
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold mb-2">Justification</h3>
                                    <p className="text-sm text-muted-foreground">{result.justification}</p>
                                </div>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </div>
    );
}
