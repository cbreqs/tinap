
"use client";

import * as React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Appointment, Customer } from "@/types";
import { CalendarDays, User, Ban } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

type AppointmentListProps = {
  appointments: Appointment[];
  customers: Record<string, Customer>;
  selectedAppointmentId: string | null;
  onSelectAppointment: (id: string) => void;
};

function FormattedDateTime({ dateTime }: { dateTime: Date }) {
    const [formattedDate, setFormattedDate] = React.useState("");

    React.useEffect(() => {
        if (dateTime && new Date(dateTime).toString() !== 'Invalid Date') {
            setFormattedDate(format(dateTime, "PPP, p"));
        } else {
            setFormattedDate("Invalid date");
        }
    }, [dateTime]);


    if (!formattedDate) {
        return null;
    }

    return <span>{formattedDate}</span>;
}

export function AppointmentList({
  appointments,
  customers,
  selectedAppointmentId,
  onSelectAppointment,
}: AppointmentListProps) {
  const regularAppointments = appointments.filter(a => !a.isBlocked);

  if (regularAppointments.length === 0) {
    return (
        <div className="pt-8 text-center text-sm text-muted-foreground">
            <p>No appointments scheduled.</p>
        </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
       <h2 className="px-2 text-sm font-semibold tracking-tight text-muted-foreground">Appointments</h2>
      {regularAppointments.map((appointment) => {
        const customer = customers[appointment.customerId];
        return (
          <Button
            key={appointment.id}
            variant={appointment.id === selectedAppointmentId ? "secondary" : "ghost"}
            className="w-full justify-start h-auto py-2"
            onClick={() => onSelectAppointment(appointment.id)}
          >
            <div className="flex w-full items-start gap-3 text-left">
              <Avatar className={cn("mt-1 h-8 w-8", appointment.isBlocked && "bg-muted text-muted-foreground")}>
                  <AvatarImage src={customer?.profilePictureUrl} data-ai-hint="profile picture" />
                  <AvatarFallback>
                      {appointment.isBlocked ? <Ban className="h-5 w-5" /> : customer?.name?.charAt(0) || <User className="h-5 w-5" />}
                  </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm truncate">{appointment.customerName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  <FormattedDateTime dateTime={appointment.dateTime} />
                </div>
              </div>
            </div>
          </Button>
        )
      })}
    </div>
  );
}

    