'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Facebook, Twitter, Youtube, Instagram } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { School } from "@/lib/data";
import { addSchoolAction, updateSchoolAction } from '@/lib/actions/schools';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

const CURRENT_YEAR = new Date().getFullYear();

const schoolSchema = z.object({
  name: z.string().min(1, { message: "School name is required." }),
  abbreviation: z.string().optional(),
  motto: z.string().optional(),
  establishmentYear: z.coerce.number().int().min(1000).max(CURRENT_YEAR).optional().or(z.literal('')),
  principal: z.string().optional(),
  socialMedia: z.object({
    facebook: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
    twitter: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
    instagram: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
    youtube: z.string().url({ message: "Invalid URL" }).optional().or(z.literal('')),
  }).optional(),
  logoUrl: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal('')),
  logoDataUri: z.string().optional(),
  website: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  brandColors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
  }).optional(),
});


type SchoolFormValues = z.infer<typeof schoolSchema>;

export function SchoolDialog({ mode, school, open, onOpenChange }: { mode: 'add' | 'edit', school?: School, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: mode === 'edit' && school ? { ...school } : {
        name: "", abbreviation: "", logoUrl: "", website: "", phone: "", location: "",
        motto: "", principal: "", socialMedia: {}, establishmentYear: undefined,
        brandColors: { primary: '#000000', secondary: '#ffffff' }
    },
  });

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && school) {
        form.reset({
            ...school,
            abbreviation: school.abbreviation || '',
            motto: school.motto || '',
            principal: school.principal || '',
            website: school.website || '',
            phone: school.phone || '',
            location: school.location || '',
            logoUrl: school.logoUrl || '',
            establishmentYear: school.establishmentYear || '',
            socialMedia: school.socialMedia || { facebook: '', twitter: '', instagram: '', youtube: '' },
            brandColors: school.brandColors || { primary: '#000000', secondary: '#ffffff' },
        });
        setLogoPreview(school.logoUrl || null);
      } else {
        form.reset({
            name: "", abbreviation: "", logoUrl: "", website: "", phone: "", location: "",
            motto: "", principal: "", socialMedia: { facebook: '', twitter: '', instagram: '', youtube: ''}, establishmentYear: '',
            brandColors: { primary: '#000000', secondary: '#ffffff' },
            logoDataUri: "",
        });
        setLogoPreview(null);
      }
    }
  }, [school, mode, open, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUri = reader.result as string;
            setLogoPreview(dataUri);
            form.setValue('logoDataUri', dataUri);
            form.setValue('logoUrl', '');
        };
        reader.readAsDataURL(file);
    }
  };


  function onSubmit(data: SchoolFormValues) {
    startTransition(async () => {
      try {
        if (mode === 'edit' && school) {
          await updateSchoolAction({ schoolId: school.schoolId, ...data });
          toast({ title: "School Updated", description: `${data.name} has been successfully updated.` });
        } else {
          await addSchoolAction(data);
          toast({ title: "School Added", description: `${data.name} has been successfully created.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Could not save school.", variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit School' : 'Add New School'}</DialogTitle>
          <DialogDescription>Enter the school's details across the tabs below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
              </TabsList>
              <div className="p-1">
                <TabsContent value="general" className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>School Name</FormLabel><FormControl><Input placeholder="e.g. Greenwood High" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="abbreviation" render={({ field }) => (<FormItem><FormLabel>Abbreviation (Optional)</FormLabel><FormControl><Input placeholder="e.g. GHS" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="principal" render={({ field }) => (<FormItem><FormLabel>Principal / Headmaster (Optional)</FormLabel><FormControl><Input placeholder="e.g. Mr. John Smith" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="establishmentYear" render={({ field }) => (<FormItem><FormLabel>Year Established (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g. 1955" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                </TabsContent>
                <TabsContent value="contact" className="space-y-4">
                    <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location / Address</FormLabel><FormControl><Input placeholder="e.g. 123 Academy Lane, Knowledgeton" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="e.g. +27 31 123 4567" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="website" render={({ field }) => (<FormItem><FormLabel>Website URL</FormLabel><FormControl><Input placeholder="e.g. https://www.school.com" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <Separator />
                    <h4 className="font-medium text-sm">Social Media (Optional)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="socialMedia.facebook" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Facebook className="mr-2"/>Facebook</FormLabel><FormControl><Input placeholder="https://facebook.com/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="socialMedia.twitter" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Twitter className="mr-2"/>Twitter / X</FormLabel><FormControl><Input placeholder="https://x.com/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="socialMedia.instagram" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Instagram className="mr-2"/>Instagram</FormLabel><FormControl><Input placeholder="https://instagram.com/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="socialMedia.youtube" render={({ field }) => (<FormItem><FormLabel className="flex items-center"><Youtube className="mr-2"/>YouTube</FormLabel><FormControl><Input placeholder="https://youtube.com/..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </TabsContent>
                <TabsContent value="branding" className="space-y-4">
                  <FormField control={form.control} name="motto" render={({ field }) => (<FormItem><FormLabel>Motto / Tagline (Optional)</FormLabel><FormControl><Input placeholder="e.g. Striving for Excellence" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input placeholder="https://..." {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                  
                  <div className="relative flex items-center justify-center text-sm text-muted-foreground"><Separator className="w-full" /><span className="absolute bg-popover px-2">OR</span></div>
                  
                  <FormItem>
                      <FormLabel>Upload Logo File</FormLabel>
                      <FormControl><Input type="file" accept="image/*" onChange={handleFileChange} disabled={isPending} /></FormControl>
                      <FormMessage />
                  </FormItem>

                  {logoPreview && (
                      <div className="flex flex-col items-center">
                          <Label className="mb-2">Logo Preview</Label>
                          <Avatar className="h-24 w-24">
                              <AvatarImage src={logoPreview} alt="Logo Preview"/>
                              <AvatarFallback>Logo</AvatarFallback>
                          </Avatar>
                      </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="brandColors.primary" render={({ field }) => (<FormItem><FormLabel>Primary Color</FormLabel><FormControl><Input type="color" {...field} value={field.value ?? '#000000'} disabled={isPending} className="p-1 h-10" /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="brandColors.secondary" render={({ field }) => (<FormItem><FormLabel>Secondary Color</FormLabel><FormControl><Input type="color" {...field} value={field.value ?? '#ffffff'} disabled={isPending} className="p-1 h-10" /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save School"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
