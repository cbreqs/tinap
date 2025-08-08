

export type Appointment = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  dateTime: Date;
  notes: string;
  attachments: { name: string; size: number; url: string; type: string; }[];
  isBlocked?: boolean;
  customerId: string;
};

export type CustomReminder = {
    id: string;
    title: string;
    message: string;
    sendAt: Date;
};

export type FollowUpReminder = {
    id:string;
    appointmentId: string;
    title: string;
    message: string;
    weeksAfter: number;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  pastBookingData: string;
  userBehaviorData: string;
  profilePictureUrl?: string;
  birthday?: string;
  customReminders?: CustomReminder[];
  followUpReminders?: FollowUpReminder[];
  history?: string[];
};

export type CustomerUpdateRequest = {
    id: string;
    customerId: string;
    currentData: {
        name: string;
        email: string;
    };
    requestedData: {
        name?: string;
        email?: string;
    };
    status: 'pending' | 'approved' | 'rejected';
};
