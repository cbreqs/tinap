
"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { add, format, set, isSameDay, isBefore } from "date-fns";
import { Calendar as CalendarIcon, Clock, Info, UserCheck, UserPlus, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Appointment, Customer } from "@/types";
import { allAvailableTimes } from "@/lib/time";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  phone: z.string().min(12, "Please enter a valid phone number."),
  customerName: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  date: z.date({ required_error: "Please select a date." }),
  time: z.string({ required_error: "Please select a time." }),
});

type AppointmentBookingProps = {
  onBookAppointment: (appointment: Omit<Appointment, 'id' | 'attachments' | 'notes'> & {isNewCustomer: boolean, updates?: {name?:string, email?:string}}, appointmentIdToUpdate?: string) => void;
  appointments: Appointment[];
  customers: Record<string, Customer>;
  editingAppointment?: Appointment | null;
};

export function AppointmentBooking({ onBookAppointment, appointments, customers, editingAppointment = null }: AppointmentBookingProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(editingAppointment ? editingAppointment.dateTime : new Date());
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [foundCustomer, setFoundCustomer] = React.useState<Customer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      customerName: "",
      email: "",
    },
  });

  React.useEffect(() => {
    if (editingAppointment) {
      const customer = Object.values(customers).find(c => c.id === editingAppointment.customerId);
      form.reset({
        phone: editingAppointment.phone,
        customerName: editingAppointment.customerName,
        email: editingAppointment.email,
        date: editingAppointment.dateTime,
        time: format(editingAppointment.dateTime, "HH:mm"),
      });
      setSelectedDate(editingAppointment.dateTime);
      if (customer) {
        setFoundCustomer(customer);
      }
    }
  }, [editingAppointment, form, customers]);

  const formatPhoneNumber = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    const len = numericValue.length;
    if (len === 0) return '';
    if (len <= 3) return numericValue;
    if (len <= 6) return `${numericValue.slice(0, 3)}-${numericValue.slice(3, 6)}`;
    return `${numericValue.slice(0, 3)}-${numericValue.slice(3, 6)}-${numericValue.slice(6, 10)}`;
  };
  
  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (editingAppointment) return; // Don't allow phone changes when editing
    const formatted = formatPhoneNumber(event.target.value);
    form.setValue('phone', formatted, { shouldValidate: true });
  }

  const handlePhoneBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (editingAppointment) return; // Don't allow lookups when editing

    const phone = event.target.value.replace(/[^\d]/g, ''); // Use raw numbers for lookup
    if (!phone || phone.length < 10) {
      setFoundCustomer(null);
      setIsNewCustomer(false);
      setIsEditing(false);
      return;
    }

    // Search by matching unformatted phone numbers
    const existingCustomer = Object.values(customers).find(c => c.phone.replace(/[^\d]/g, '') === phone);
    
    if (existingCustomer) {
      setFoundCustomer(existingCustomer);
      setIsNewCustomer(false);
      setIsEditing(false);
      form.setValue('customerName', existingCustomer.name);
      form.setValue('email', existingCustomer.email);
    } else {
      setFoundCustomer(null);
      setIsNewCustomer(true);
      setIsEditing(false);
      if (form.getValues('customerName') && form.getValues('email')) return;
      form.setValue('customerName', '');
      form.setValue('email', '');
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const [hours, minutes] = values.time.split(":").map(Number);
    const appointmentDateTime = set(values.date, { hours, minutes });

    let updates: { name?: string; email?: string } | undefined = undefined;
    if (isEditing && foundCustomer) {
        updates = {};
        if (values.customerName !== foundCustomer.name) {
            updates.name = values.customerName;
        }
        if (values.email !== foundCustomer.email) {
            updates.email = values.email;
        }
        if (Object.keys(updates).length === 0) {
            updates = undefined;
        }
    }

    const submissionData = {
        customerName: values.customerName,
        email: values.email,
        phone: values.phone,
        dateTime: appointmentDateTime,
        isNewCustomer: !foundCustomer,
        updates: updates
    };

    await onBookAppointment(submissionData, editingAppointment?.id);

    // Toast is now handled in the parent component
    setIsSubmitting(false);
    form.reset();
    setFoundCustomer(null);
    setIsNewCustomer(false);
    setIsEditing(false);
  };

  const availableTimes = React.useMemo(() => {
    if (!selectedDate) return [];
    
    // When editing, the original slot should be available
    const originalTime = editingAppointment && isSameDay(editingAppointment.dateTime, selectedDate) 
      ? format(editingAppointment.dateTime, 'HH:mm')
      : null;

    const bookedTimesOnSelectedDate = appointments
      .filter(appt => 
          isSameDay(appt.dateTime, selectedDate) &&
          // Exclude the appointment being edited from the booked list
          (!editingAppointment || appt.id !== editingAppointment.id)
      )
      .map(appt => format(appt.dateTime, 'HH:mm'));

    const now = new Date();
    // Allow booking up to 1 hour from now
    const cutOffTime = add(now, { hours: 1 });

    return allAvailableTimes.filter(time => {
        if (time === originalTime) {
            return true;
        }
        if (bookedTimesOnSelectedDate.includes(time)) {
            return false;
        }

        if (isSameDay(selectedDate, now)) {
            const [hours, minutes] = time.split(':').map(Number);
            const slotDateTime = set(selectedDate, { hours, minutes });
            // check if the slot is in the past or within the next hour
            return isBefore(cutOffTime, slotDateTime);
        }

        return true;
    });
  }, [selectedDate, appointments, editingAppointment]);

  return (
    <Card className="border-0 shadow-none md:border md:shadow-sm">
      <CardHeader>
        <CardTitle>{editingAppointment ? 'Edit Appointment' : 'Book a New Appointment'}</CardTitle>
        <CardDescription>
            {editingAppointment 
                ? 'Update the details for this appointment.'
                : 'Fill in the details to schedule a new appointment. Start with the phone number to find existing clients.'
            }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. 123-456-7890" 
                        {...field}
                        onChange={handlePhoneChange}
                        onBlur={handlePhoneBlur}
                        disabled={!!editingAppointment}
                       />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                {foundCustomer && !editingAppointment && (
                    <Alert variant="default" className="border-green-500 bg-green-50 text-green-800">
                        <UserCheck className="h-4 w-4 !text-green-600" />
                        <AlertDescription>
                            Welcome back, {foundCustomer.name}! We've filled in your details.
                        </AlertDescription>
                    </Alert>
                )}
                {isNewCustomer && (
                    <Alert>
                        <UserPlus className="h-4 w-4" />
                        <AlertDescription>
                            Welcome! We don't have this number on file. Please enter your name and email to continue.
                        </AlertDescription>
                    </Alert>
                )}
              </div>
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. John Doe" {...field} disabled={!!foundCustomer && !isEditing && !editingAppointment} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. john.doe@example.com" {...field} disabled={!!foundCustomer && !isEditing && !editingAppointment} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               {foundCustomer && !isEditing && !editingAppointment && (
                 <div className="md:col-span-2 flex justify-start">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                    </Button>
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Appointment Date</FormLabel>
                  <FormControl>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setSelectedDate(date);
                        form.resetField("time");
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || date > add(new Date(), {months: 3})}
                      initialFocus
                      className="rounded-md border p-3 self-center"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedDate && (
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Time Slots for {format(selectedDate, "PPP")}</FormLabel>
                    <FormControl>
                      <div>
                        {availableTimes.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {availableTimes.map((time) => (
                                <Button
                                key={time}
                                type="button"
                                variant={field.value === time ? "default" : "outline"}
                                onClick={() => field.onChange(time)}
                                className="flex items-center gap-2"
                                >
                                <Clock className="h-4 w-4" />
                                {time}
                                </Button>
                            ))}
                            </div>
                        ) : (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    There are no available time slots for this day. Please select another date.
                                </AlertDescription>
                            </Alert>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={!form.watch('time') || isSubmitting}>
              {isSubmitting ? (editingAppointment ? 'Updating...' : 'Booking...') : (editingAppointment ? 'Update Appointment' : 'Confirm Booking')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
