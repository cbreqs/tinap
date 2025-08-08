
"use client";

import * as React from "react";
import { addDays, addHours, startOfTomorrow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentList } from "@/components/bookwise/AppointmentList";
import { AppointmentBooking } from "@/components/bookwise/AppointmentBooking";
import { Logo } from "@/components/icons/Logo";
import type { Appointment, Customer, CustomerUpdateRequest } from "@/types";
import { CalendarPlus, Calendar, LayoutGrid } from "lucide-react";
import { CalendarView } from "@/components/bookwise/CalendarView";
import { useToast } from "@/hooks/use-toast";
import { PendingRequests } from "@/components/bookwise/PendingRequests";

const now = new Date();

const initialAppointments: Appointment[] = [
  {
    id: "appt-1",
    customerId: "1",
    customerName: "Alice Johnson",
    email: "alice.j@example.com",
    phone: "123-456-7890",
    dateTime: addHours(startOfTomorrow(), 10),
    notes: "Follow-up regarding the new design system.",
    attachments: [],
  },
  {
    id: "appt-2",
    customerId: "2",
    customerName: "Bob Williams",
    email: "bob.w@example.com",
    phone: "234-567-8901",
    dateTime: addHours(startOfTomorrow(), 14),
    notes: "Discussing the Q3 marketing budget.",
    attachments: [],
  },
  {
    id: "appt-3",
    customerId: "3",
    customerName: "Charlie Brown",
    email: "charlie.b@example.com",
    phone: "345-678-9012",
    dateTime: addDays(now, 2),
    notes: "Initial consultation for the new project.",
    attachments: [],
  },
];

export const initialCustomersData: Record<string, Customer> = {
  "1": {
    id: "1",
    name: "Alice Johnson",
    email: "alice.j@example.com",
    phone: "123-456-7890",
    pastBookingData: "3 previous appointments, all on time. Prefers morning slots. Usually books a trim every 6-8 weeks.",
    userBehaviorData: "Responds to email reminders within an hour. Last booked via mobile.",
    customReminders: [],
    followUpReminders: [],
    history: [],
  },
  "2": {
    id: "2",
    name: "Bob Williams",
    email: "bob.w@example.com",
    phone: "234-567-8901",
    pastBookingData: "1 previous appointment, rescheduled once. No-show risk is low.",
    userBehaviorData: "Always confirms via SMS link.",
    customReminders: [],
    followUpReminders: [],
    history: [],
  },
  "3": {
    id: "3",
    name: "Charlie Brown",
    email: "charlie.b@example.com",
    phone: "345-678-9012",
    pastBookingData: "New customer.",
    userBehaviorData: "Booked via desktop website.",
    customReminders: [],
    followUpReminders: [],
    history: [],
  },
};

export default function Home() {
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [customersData, setCustomersData] = React.useState<Record<string, Customer>>({});
  const [customerUpdateRequests, setCustomerUpdateRequests] = React.useState<CustomerUpdateRequest[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = React.useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] = React.useState<Appointment | null>(null);
  const [view, setView] = React.useState<'calendar' | 'booking'>('calendar');
  const [calendarDate, setCalendarDate] = React.useState(new Date());
  const [isLoaded, setIsLoaded] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const storedAppointments = localStorage.getItem("appointments");
      const storedCustomers = localStorage.getItem("customersData");
      const storedUpdateRequests = localStorage.getItem("customerUpdateRequests");

      const loadedAppointments = storedAppointments ? JSON.parse(storedAppointments, (key, value) => {
        if (key === 'dateTime') return new Date(value);
        return value;
      }) : initialAppointments;

      const loadedCustomers = storedCustomers ? JSON.parse(storedCustomers) : initialCustomersData;
      const loadedUpdateRequests = storedUpdateRequests ? JSON.parse(storedUpdateRequests) : [];

      setAppointments(loadedAppointments);
      setCustomersData(loadedCustomers);
      setCustomerUpdateRequests(loadedUpdateRequests);

       if (!selectedAppointmentId && loadedAppointments.length > 0) {
        const firstNonBlocked = loadedAppointments.find(a => !a.isBlocked);
        if (firstNonBlocked) {
          setSelectedAppointmentId(firstNonBlocked.id);
        }
      }
      
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
        setAppointments(initialAppointments);
        setCustomersData(initialCustomersData);
        setCustomerUpdateRequests([]);
    }
    setIsLoaded(true);
  }, []);

  React.useEffect(() => {
    if (isLoaded) {
        try {
            localStorage.setItem("appointments", JSON.stringify(appointments));
            localStorage.setItem("customersData", JSON.stringify(customersData));
            localStorage.setItem("customerUpdateRequests", JSON.stringify(customerUpdateRequests));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
        }
    }
  }, [appointments, customersData, customerUpdateRequests, isLoaded]);

  const handleSelectAppointment = (id: string) => {
    setSelectedAppointmentId(id);
    // For now, selecting an appointment just highlights it.
    // The main view doesn't change.
  };
  
  const handleSetView = (newView: 'calendar' | 'booking') => {
    setEditingAppointment(null);
    setView(newView);
  }

  const handleBookAppointment = async (newAppointmentData: Omit<Appointment, 'id' | 'attachments' | 'notes' | 'customerId'> & {isNewCustomer: boolean, updates?: {name?: string, email?: string}}, appointmentIdToUpdate?: string) => {
    
    if (appointmentIdToUpdate) {
        // This is an update to an existing appointment
        setAppointments(prev => prev.map(appt => {
            if (appt.id === appointmentIdToUpdate) {
                return {
                    ...appt,
                    ...newAppointmentData,
                    dateTime: newAppointmentData.dateTime,
                };
            }
            return appt;
        }));
        toast({
            title: "Appointment Updated!",
            description: "The appointment has been successfully updated.",
        });
    } else {
        // This is a new appointment booking
        const { isNewCustomer, updates, ...appointmentData } = newAppointmentData;
        const newAppointmentId = `appt-${new Date().getTime().toString()}`;

        let customerId: string;
        let customer: Customer;

        const existingCustomer = Object.values(customersData).find(c => c.phone.replace(/[^\d]/g, '') === appointmentData.phone.replace(/[^\d]/g, ''));
        
        if (existingCustomer) {
            customerId = existingCustomer.id;
            customer = existingCustomer;
            if (updates) {
                const updateRequest: CustomerUpdateRequest = {
                    id: `req-${Date.now()}`,
                    customerId: customerId,
                    currentData: { name: customer.name, email: customer.email },
                    requestedData: updates,
                    status: 'pending'
                };
                setCustomerUpdateRequests(prev => [...prev, updateRequest]);
            }
        } else {
            const newCustomerId = new Date().getTime().toString();
            customerId = newCustomerId;
            customer = {
                id: customerId,
                name: appointmentData.customerName,
                email: appointmentData.email,
                phone: appointmentData.phone,
                pastBookingData: "New customer.",
                userBehaviorData: "Booked via application.",
                customReminders: [],
                followUpReminders: [],
                history: [],
            };
            setCustomersData(prev => ({ ...prev, [customerId]: customer }));
        }

        const newAppointment: Appointment = {
        ...appointmentData,
        id: newAppointmentId,
        customerId: customerId,
        attachments: [],
        notes: ""
        };

        setAppointments(prev => [...prev, newAppointment].sort((a,b) => a.dateTime.getTime() - b.dateTime.getTime()));
        
        if (!newAppointment.isBlocked) {
        setSelectedAppointmentId(newAppointment.id);
        
        toast({
            title: "Appointment Booked!",
            description: "The new appointment has been added to the calendar.",
        });
        }
    }
    
    setView('calendar');
    setEditingAppointment(null);
  };
  
  const handleCancelAppointment = (appointmentId: string) => {
    const wasSelected = selectedAppointmentId === appointmentId;
  
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
  
    if (wasSelected) {
      setSelectedAppointmentId(null);
    }
  };

  const handleEditAppointment = (appointmentId: string) => {
    const appointmentToEdit = appointments.find(a => a.id === appointmentId);
    if (appointmentToEdit) {
        setEditingAppointment(appointmentToEdit);
        setView('booking');
    }
  };

  const handleApproveRequest = (requestId: string) => {
    const request = customerUpdateRequests.find(r => r.id === requestId);
    if (!request) return;

    setCustomersData(prev => {
        const customer = prev[request.customerId];
        if (!customer) return prev;
        
        const newHistory = [...(customer.history || [])];
        const updatedCustomer = { ...customer };

        if (request.requestedData.name && request.requestedData.name !== customer.name) {
            newHistory.push(`Name updated from "${customer.name}" to "${request.requestedData.name}" on ${new Date().toLocaleDateString()}`);
            updatedCustomer.name = request.requestedData.name;
        }
        if (request.requestedData.email && request.requestedData.email !== customer.email) {
            newHistory.push(`Email updated from "${customer.email}" to "${request.requestedData.email}" on ${new Date().toLocaleDateString()}`);
            updatedCustomer.email = request.requestedData.email;
        }
        updatedCustomer.history = newHistory;

        // Also update any future appointments for this customer
        setAppointments(prevAppointments => prevAppointments.map(appt => {
            if(appt.customerId === request.customerId && appt.dateTime > new Date()) {
                const newAppt = { ...appt };
                if (request.requestedData.name) newAppt.customerName = request.requestedData.name;
                if (request.requestedData.email) newAppt.email = request.requestedData.email;
                return newAppt;
            }
            return appt;
        }));


        return { ...prev, [request.customerId]: updatedCustomer };
    });

    setCustomerUpdateRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
    
    toast({
        title: "Update Approved",
        description: "Customer information has been updated.",
    });
  };

  const handleRejectRequest = (requestId: string) => {
    setCustomerUpdateRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
    toast({
        variant: "destructive",
        title: "Update Rejected",
        description: "The requested change has been rejected.",
    });
  };
  
  const MainContent = () => {
    if (view === 'booking') {
      return <AppointmentBooking onBookAppointment={handleBookAppointment} appointments={appointments} customers={customersData} editingAppointment={editingAppointment} />;
    }
    if (view === 'calendar') {
        return <CalendarView 
            appointments={appointments} 
            onBookAppointment={handleBookAppointment} 
            onCancelAppointment={handleCancelAppointment} 
            onEditAppointment={handleEditAppointment}
            currentDate={calendarDate}
            onSetCurrentDate={setCalendarDate}
        />;
    }
    
    return (
      <Card className="flex h-full min-h-[60vh] items-center justify-center">
        <CardContent className="flex flex-col items-center gap-4 text-center p-6">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <LayoutGrid className="h-12 w-12" />
          </div>
          <CardTitle>Welcome to BookWise</CardTitle>
          <CardDescription>Select an appointment, book a new one, or view your calendar.</CardDescription>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[350px_1fr]">
        <aside className="border-r bg-card text-card-foreground">
          <div className="flex h-full max-h-screen flex-col">
            <header className="flex h-16 items-center border-b px-6">
              <div className="flex items-center gap-3">
                <Logo className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-semibold">BookWise</h1>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                <Button onClick={() => handleSetView('booking')} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  <CalendarPlus className="mr-2 h-4 w-4" /> Book Appointment
                </Button>
                <Button onClick={() => handleSetView('calendar')} variant="outline" className="w-full">
                    <Calendar className="mr-2 h-4 w-4" /> View Calendar
                </Button>
              </div>
              <AppointmentList
                appointments={appointments}
                customers={customersData}
                selectedAppointmentId={selectedAppointmentId}
                onSelectAppointment={handleSelectAppointment}
              />
              <PendingRequests requests={customerUpdateRequests} onApprove={handleApproveRequest} onReject={handleRejectRequest} />
            </div>
          </div>
        </aside>
        <main className="p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <MainContent />
        </main>
      </div>
    </div>
  );
}
