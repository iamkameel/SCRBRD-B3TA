
'use client';

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Field, School, Person } from "@/lib/data";
import { addFieldAction, updateFieldAction } from '@/lib/actions/fields';
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

const fieldActionSchema = z.object({
  name: z.string().min(1, { message: "Field name is required." }),
  schoolId: z.string().optional(),
  status: z.enum(['Available', 'Maintenance', 'Closed']).default('Available'),
  pitchType: z.string().optional(),
  facilities: z.array(z.string()).optional(),
  assignments: z.array(z.string()).optional(),
  location: z.string().optional(),
  size: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  alias: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  surfaceCondition: z.object({
      rating: z.coerce.number().min(1).max(5),
      details: z.record(z.string()).optional(),
  }).optional(),
  coordinates: z.object({
      lat: z.coerce.number().min(-90).max(90).optional(),
      lon: z.coerce.number().min(-180).max(180).optional(),
  }).optional(),
});


type FieldFormValues = z.infer<typeof fieldActionSchema>;
const FIELD_STATUSES = ['Available', 'Maintenance', 'Closed'] as const;
const PITCH_TYPES = ['Natural Turf', 'Drop-in Turf', 'Artificial Astro-Turf', 'Matting Wicket', 'Concrete Base', 'Indoor Synthetic', 'Hybrid Reinforced', 'Drop-in Artificial'] as const;
const FIELD_SIZES = ['Full Size', 'Youth', 'Training Area'] as const;
const FACILITIES = [
    { id: 'pavilion', label: 'Pavilion' },
    { id: 'toilets', label: 'Toilets' },
    { id: 'nets', label: 'Nets' },
    { id: 'scoreboard', label: 'Scoreboard' },
    { id: 'floodlights', label: 'Floodlights' },
] as const;
const AMENITIES = [
    { id: 'parking', label: 'Parking' },
    { id: 'seating', label: 'Seating' },
    { id: 'food_drink', label: 'Food & Drink' },
    { id: 'changing_rooms', label: 'Changing Rooms' },
] as const;


export function FieldDialog({ mode, field, schools, groundskeepers, open, onOpenChange }: { mode: 'add' | 'edit', field?: Field, schools: School[], groundskeepers: Person[], open: boolean, onOpenChange: (open: boolean) => void; }) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldActionSchema),
    defaultValues: {
      name: "", alias: "", schoolId: ' ', status: "Available", pitchType: 'Natural Turf', facilities: [], amenities: [], assignments: [],
      contactPerson: "", contactPhone: "", notes: "", location: "", size: "",
      surfaceCondition: { rating: 3, details: {} }
    }
  });
  
  const pitchType = form.watch('pitchType');
  const ratingValue = form.watch('surfaceCondition.rating');

  React.useEffect(() => {
    if (open) {
      if (mode === 'edit' && field) {
        form.reset({
          name: field.name,
          alias: field.alias || '',
          schoolId: field.schoolId || ' ',
          status: field.status,
          pitchType: field.pitchType || 'Natural Turf',
          facilities: field.facilities || [],
          assignments: field.assignments?.map(a => a.personId) || [],
          location: field.location || '',
          size: field.size || '',
          amenities: field.amenities || [],
          contactPerson: field.contactPerson || '',
          contactPhone: field.contactPhone || '',
          notes: field.notes || '',
          surfaceCondition: field.surfaceCondition || { rating: 3, details: {} },
          coordinates: {
              lat: field.coordinates?.lat,
              lon: field.coordinates?.lon
          },
        });
      } else {
        form.reset({ name: "", alias: "", schoolId: ' ', status: "Available", pitchType: 'Natural Turf', facilities: [], amenities: [], assignments: [], contactPerson: "", contactPhone: "", notes: "", location: "", size: "", coordinates: { lat: undefined, lon: undefined }, surfaceCondition: { rating: 3, details: {} } });
      }
    }
  }, [field, mode, open, form]);

  function onSubmit(data: FieldFormValues) {
    startTransition(async () => {
      try {
        const payload = { ...data, schoolId: data.schoolId?.trim() === '' ? undefined : data.schoolId };
        if (mode === 'edit' && field) {
          await updateFieldAction({ fieldId: field.fieldId, ...payload });
          toast({ title: "Field Updated", description: `${data.name} has been updated.` });
        } else {
          await addFieldAction(payload);
          toast({ title: "Field Added", description: `${data.name} has been created.` });
        }
        onOpenChange(false);
      } catch (error) {
        toast({ title: "Error", description: error instanceof Error ? error.message : `Could not ${mode} field.`, variant: "destructive" });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === 'edit' ? 'Edit Field' : 'Add New Field'}</DialogTitle><DialogDescription>Enter the details for the field or venue.</DialogDescription></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Field Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Field Name</FormLabel><FormControl><Input placeholder="e.g. Main Oval" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="alias" render={({ field }) => (<FormItem><FormLabel>Alias (Optional)</FormLabel><FormControl><Input placeholder="e.g. The Oval" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField control={form.control} name="schoolId" render={({ field }) => (<FormItem><FormLabel>Owning School (Optional)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a school (if applicable)" /></SelectTrigger></FormControl><SelectContent><SelectItem value=" ">-- None (Independent Field) --</SelectItem>{schools.map((s) => (<SelectItem key={s.schoolId} value={s.schoolId}>{s.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                
                <h3 className="text-sm font-medium text-muted-foreground pt-2">Location</h3>
                <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location / Address</FormLabel><FormControl><Input placeholder="e.g. 123 Cricket Lane, Sportsville" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="coordinates.lat" render={({ field }) => (<FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="any" placeholder="-29.318" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="coordinates.lon" render={({ field }) => (<FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="any" placeholder="29.96" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} value={field.value} defaultValue="Available" disabled={isPending}><FormControl><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger></FormControl><SelectContent>{FIELD_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
            </div>
            <Separator />
             <div className="space-y-4">
                 <h3 className="text-base font-semibold text-foreground">Surface &amp; Condition</h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="pitchType" render={({ field }) => (<FormItem><FormLabel>Pitch Type</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{PITCH_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="size" render={({ field }) => (<FormItem><FormLabel>Field Size</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger></FormControl><SelectContent>{FIELD_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                 </div>
                 <FormField control={form.control} name="surfaceCondition.rating" render={({ field }) => (<FormItem><FormLabel>Overall Condition Rating: {ratingValue}/5</FormLabel><FormControl><Slider onValueChange={(value) => field.onChange(value[0])} value={[field.value ?? 3]} min={1} max={5} step={1} disabled={isPending} /></FormControl></FormItem>)} />
                 
                 {pitchType === 'Natural Turf' && (
                    <div className="space-y-4 rounded-md border p-4 bg-muted/50">
                        <h4 className="font-medium text-sm">Natural Turf Details</h4>
                        <FormField control={form.control} name="surfaceCondition.details.grassCover" render={({ field }) => (<FormItem><FormLabel>Grass Cover (%)</FormLabel><FormControl><Input type="number" placeholder="90" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="surfaceCondition.details.moisture" render={({ field }) => (<FormItem><FormLabel>Moisture Level</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select moisture level"/></SelectTrigger></FormControl><SelectContent><SelectItem value="Dry">Dry</SelectItem><SelectItem value="Ideal">Ideal</SelectItem><SelectItem value="Wet">Wet</SelectItem></SelectContent></Select></FormItem>)} />
                        <FormField control={form.control} name="surfaceCondition.details.firmness" render={({ field }) => (<FormItem><FormLabel>Firmness</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select firmness"/></SelectTrigger></FormControl><SelectContent><SelectItem value="Soft">Soft</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Firm">Firm</SelectItem></SelectContent></Select></FormItem>)} />
                    </div>
                 )}
                 {pitchType === 'Artificial Astro-Turf' && (
                     <div className="space-y-4 rounded-md border p-4 bg-muted/50">
                        <h4 className="font-medium text-sm">Artificial Astro-Turf Details</h4>
                        <FormField control={form.control} name="surfaceCondition.details.pileHeight" render={({ field }) => (<FormItem><FormLabel>Pile Height (mm)</FormLabel><FormControl><Input type="number" placeholder="12" {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="surfaceCondition.details.infillDepth" render={({ field }) => (<FormItem><FormLabel>Infill Depth (mm)</FormLabel><FormControl><Input type="number" placeholder="8" {...field} /></FormControl></FormItem>)} />
                    </div>
                 )}
                  <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>General Notes</FormLabel><FormControl><Textarea placeholder="e.g. Excellent drainage, pitch plays fast." {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />

             </div>
            <Separator />
            <div className="space-y-4">
                 <h3 className="text-base font-semibold text-foreground">Facilities &amp; Amenities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <FormField control={form.control} name="facilities" render={() => (
                        <FormItem><FormLabel>Facilities</FormLabel><div className="space-y-2 rounded-lg border p-4">
                        {FACILITIES.map((item) => (<FormField key={item.id} control={form.control} name="facilities" render={({ field }) => { return (<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => { return checked ? field.onChange([...field.value || [], item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))}} disabled={isPending}/></FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>)}}/>))}
                        </div><FormMessage />
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="amenities" render={() => (
                        <FormItem><FormLabel>Amenities</FormLabel><div className="space-y-2 rounded-lg border p-4">
                        {AMENITIES.map((item) => (<FormField key={item.id} control={form.control} name="amenities" render={({ field }) => { return (<FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => { return checked ? field.onChange([...field.value || [], item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))}} disabled={isPending}/></FormControl><FormLabel className="font-normal">{item.label}</FormLabel></FormItem>)}}/>))}
                        </div><FormMessage />
                        </FormItem>
                    )}/>
                </div>
            </div>
            <Separator />
             <div className="space-y-4">
                <h3 className="text-base font-semibold text-foreground">Contact &amp; Staffing</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="contactPerson" render={({ field }) => (<FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input placeholder="e.g. John Smith" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="contactPhone" render={({ field }) => (<FormItem><FormLabel>Contact Phone</FormLabel><FormControl><Input placeholder="e.g. 555-1234" {...field} value={field.value ?? ''} disabled={isPending} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                 <FormField control={form.control} name="assignments" render={() => (
                    <FormItem>
                        <FormLabel>Assigned Grounds-Keepers</FormLabel>
                        <FormDescription>Select the staff responsible for this field.</FormDescription>
                        <ScrollArea className="h-40 w-full rounded-lg border p-4">
                        {groundskeepers.length > 0 ? (
                            groundskeepers.map((person) => (
                                <FormField key={person.personId} control={form.control} name="assignments" render={({ field }) => { return (<FormItem key={person.personId} className="flex flex-row items-start space-x-3 space-y-0 mb-4"><FormControl><Checkbox checked={field.value?.includes(person.personId)} onCheckedChange={(checked) => { return checked ? field.onChange([...field.value || [], person.personId]) : field.onChange(field.value?.filter((id) => id !== person.personId))}} /></FormControl><FormLabel className="font-normal">{person.firstName} {person.lastName}</FormLabel></FormItem>)}}/>
                            ))
                        ) : (
                            <p className="text-sm text-center text-muted-foreground pt-4">No grounds-keepers available. Add them on the People page.</p>
                        )}
                        </ScrollArea>
                        <FormMessage />
                    </FormItem>
                )}/>
            </div>
            <DialogFooter><Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Field"}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
