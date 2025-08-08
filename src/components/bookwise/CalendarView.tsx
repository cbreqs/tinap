
"use client";

import * as React from "react";
import { add, format, set, isSameDay, startOfWeek, eachDayOfInterval, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Clock, User, Ban, Trash2, Calendar as CalendarIcon, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@/types";
import { allAvailableTimes } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type CalendarViewProps = {
  appointments: Appointment[];
  onBookAppointment: (appointment: Omit<Appointment, 'id' | 'attachments' | 'notes'>) => void;
  onCancelAppointment: (appointmentId: string) => void;
  onEditAppointment: (appointmentId: string) => void;
  currentDate: Date;
  onSetCurrentDate: (date: Date) => void;
};

export function CalendarView({ appointments, onBookAppointment, onCancelAppointment, onEditAppointment, currentDate, onSetCurrentDate }: CalendarViewProps) {
  const { toast } = useToast();

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekInterval = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: add(startOfCurrentWeek, { days: 6 }),
  });

  const getAppointmentForSlot = (day: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const slotDateTime = set(day, { hours, minutes });
    return appointments.find(appt => isSameDay(appt.dateTime, day) && format(appt.dateTime, 'HH:mm') === time);
  }

  const handleBlockTime = (dateTime: Date) => {
    onBookAppointment({
        customerName: 'Blocked Off',
        email: '',
        phone: '',
        dateTime: dateTime,
        isBlocked: true,
    });
    toast({
        title: "Time Blocked",
        description: `The time slot at ${format(dateTime, "p")} has been blocked.`
    });
  }
  
  const handleBlockDay = (day: Date) => {
    const availableSlots = allAvailableTimes.filter(time => {
      const appointment = getAppointmentForSlot(day, time);
      return !appointment;
    });

    availableSlots.forEach(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const slotDateTime = set(day, { hours, minutes });
      onBookAppointment({
        customerName: 'Blocked Off',
        email: '',
        phone: '',
        dateTime: slotDateTime,
        isBlocked: true,
      });
    });

    toast({
      title: "Day Blocked",
      description: `${format(day, "PPP")} has been blocked off.`
    });
  };

  const handleUnblockDay = (day: Date) => {
    const blockedAppointmentsOnDay = appointments.filter(
      (appt) => isSameDay(appt.dateTime, day) && appt.isBlocked && appt.customerName === 'Blocked Off'
    );

    blockedAppointmentsOnDay.forEach((appt) => onCancelAppointment(appt.id));

    toast({
      title: "Day Unblocked",
      description: `The free slots on ${format(day, "PPP")} are now available.`,
    });
  };

  const isDayFullyBlockedByManualBlocks = (day: Date) => {
    const realAppointments = appointments.filter(
        (appt) => isSameDay(appt.dateTime, day) && !appt.isBlocked
    );
    const realAppointmentTimes = new Set(realAppointments.map(a => format(a.dateTime, "HH:mm")));

    const availableSlots = allAvailableTimes.filter(time => !realAppointmentTimes.has(time));

    if (availableSlots.length === 0) {
        return false;
    }

    const manuallyBlockedSlots = appointments.filter(
        (appt) => isSameDay(appt.dateTime, day) && appt.isBlocked && appt.customerName === "Blocked Off"
    );
    const manuallyBlockedTimes = new Set(manuallyBlockedSlots.map(a => format(a.dateTime, "HH:mm")));

    return availableSlots.every(time => manuallyBlockedTimes.has(time));
  }

  const handlePreviousWeek = () => {
    onSetCurrentDate(add(currentDate, { weeks: -1 }));
  };

  const handleNextWeek = () => {
    onSetCurrentDate(add(currentDate, { weeks: 1 }));
  };
  
  const handlePreviousMonth = () => {
    onSetCurrentDate(add(currentDate, { months: -1 }));
  };

  const handleNextMonth = () => {
    onSetCurrentDate(add(currentDate, { months: 1 }));
  };
  
  const handleGoToToday = () => {
    onSetCurrentDate(new Date());
  }

  return (
    <Card className="border-0 shadow-none md:border md:shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between">
            <div>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>View your schedule and block out time.</CardDescription>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="default" onClick={handleGoToToday} className="flex flex-col h-auto items-center gap-1 p-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="text-xs">Today</span>
                </Button>
                <div className="flex flex-col items-center bg-accent/10 p-1 rounded-md">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handlePreviousMonth}><ChevronLeft/></Button>
                        <Button variant="outline" size="icon" onClick={handleNextMonth}><ChevronRight/></Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Month</p>
                </div>
                <div className="flex flex-col items-center bg-accent/10 p-1 rounded-md">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handlePreviousWeek}><ChevronLeft/></Button>
                        <Button variant="outline" size="icon" onClick={handleNextWeek}><ChevronRight/></Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Week</p>
                </div>
            </div>
        </div>
        <div className="flex items-center justify-center font-semibold text-lg mt-4">
            <span>{format(currentDate, "MMMM yyyy")}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-7 border-t border-l">
            {weekInterval.map(day => {
                const isFullyBlocked = isDayFullyBlockedByManualBlocks(day);
                return (
                    <div key={day.toString()} className="border-b border-r text-center">
                        <div className={cn(
                            "p-2 border-b",
                            isToday(day) && "bg-accent text-accent-foreground"
                        )}>
                            <p className="font-semibold text-sm">{format(day, 'EEE')}</p>
                            <p className="text-2xl font-bold">{format(day, 'd')}</p>
                        </div>
                        <div className="p-1 border-b">
                            {isFullyBlocked ? (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" className="w-full text-xs">Unblock Day</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Unblock Entire Day?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to make all available time slots on {format(day, "PPP")} available again? This will not affect existing appointments.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Go Back</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleUnblockDay(day)}>Yes, Unblock Day</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            ) : (
                                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleBlockDay(day)}>
                                Block Out Day
                                </Button>
                            )}
                        </div>
                        <div className="space-y-1 p-1">
                            {allAvailableTimes.map(time => {
                                const appointment = getAppointmentForSlot(day, time);
                                const [hours, minutes] = time.split(':').map(Number);
                                const slotDateTime = set(day, { hours, minutes });
                                
                                if (appointment) {
                                    return (
                                    <AlertDialog key={time}>
                                        <AlertDialogTrigger asChild>
                                        <Button variant={appointment.isBlocked ? "secondary" : "default"} className="w-full h-10 text-xs justify-start px-2">
                                            <div className="flex items-center gap-1 truncate">
                                            {appointment.isBlocked ? <Ban className="h-4 w-4 flex-shrink-0" /> : <User className="h-4 w-4 flex-shrink-0" />}
                                            <span className="truncate">{appointment.isBlocked ? 'Blocked' : appointment.customerName}</span>
                                            </div>
                                        </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              {appointment.isBlocked ? 'Blocked Time Slot' : 'Appointment Details'}
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                            {appointment.isBlocked
                                                ? `This time slot at ${format(appointment.dateTime, 'p')} on ${format(appointment.dateTime, 'PPP')} is currently blocked.`
                                                : (
                                                    <span>
                                                        Appointment for <span className="font-semibold text-foreground">{appointment.customerName}</span> on <span className="font-semibold text-foreground">{format(appointment.dateTime, 'PPP')}</span> at <span className="font-semibold text-foreground">{format(appointment.dateTime, 'p')}</span>.
                                                    </span>
                                                )
                                            }
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="sm:justify-between">
                                            <AlertDialogCancel>Go Back</AlertDialogCancel>
                                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
                                                {!appointment.isBlocked && (
                                                    <AlertDialogAction asChild>
                                                        <Button variant="outline" onClick={() => onEditAppointment(appointment.id)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </Button>
                                                    </AlertDialogAction>
                                                )}
                                                <AlertDialogAction onClick={() => onCancelAppointment(appointment.id)} className={cn(appointment.isBlocked && "w-full", !appointment.isBlocked && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}>
                                                  {appointment.isBlocked ? 'Unblock Slot' : 'Cancel Appointment'}
                                                </AlertDialogAction>
                                            </div>
                                        </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    )
                                }
                                
                                return (
                                    <Button key={time} variant="outline" className="w-full h-10 text-xs" onClick={() => handleBlockTime(slotDateTime)}>
                                        {time}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
      </CardContent>
    </Card>
  );
}
