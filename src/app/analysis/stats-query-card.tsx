
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bot, Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { queryStatsAction } from '@/lib/actions/analysis';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const querySchema = z.object({
  question: z.string().min(3, { message: 'Please ask a longer question.' }),
});

type QueryFormValues = z.infer<typeof querySchema>;

export function StatsQueryCard() {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [answer, setAnswer] = React.useState<string | null>(null);

  const form = useForm<QueryFormValues>({
    resolver: zodResolver(querySchema),
    defaultValues: { question: '' },
  });

  const onSubmit = (data: QueryFormValues) => {
    startTransition(async () => {
      setAnswer(null);
      try {
        const result = await queryStatsAction(data.question);
        setAnswer(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      }
    });
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Natural Language Stats Query</CardTitle>
        <CardDescription>
          Ask a question about the league stats in plain English, and the AI will find the answer for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="e.g., Who has the most wickets?"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
            </Button>
          </form>
        </Form>
        
        {(isPending || answer) && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/50 space-y-4">
                {isPending && (
                     <div className="flex items-center gap-4 text-muted-foreground">
                        <Avatar>
                            <AvatarFallback><Bot /></AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Finding an answer...</span>
                        </div>
                    </div>
                )}
                {answer && (
                     <div className="flex items-start gap-4">
                        <Avatar>
                            <AvatarFallback><Bot /></AvatarFallback>
                        </Avatar>
                        <div className="pt-1">
                            <p className="font-semibold">AI Assistant</p>
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{answer}</p>
                        </div>
                    </div>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
