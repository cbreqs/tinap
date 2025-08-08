
'use server';

/**
 * @fileOverview Smart Reminders AI agent.
 *
 * - generateReminder - A function that generates appointment reminders.
 * - SmartReminderInput - The input type for the generateReminder function.
 * - SmartReminderOutput - The return type for the generateReminder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartReminderInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  appointmentDateTime: z.string().describe('The date and time of the appointment.'),
  pastBookingData: z.string().describe('Past booking data for the customer.'),
  userBehaviorData: z.string().describe('User behavior data related to appointment scheduling.'),
});
export type SmartReminderInput = z.infer<typeof SmartReminderInputSchema>;

const SmartReminderOutputSchema = z.object({
  clientReminderMessage: z.string().describe('The content of the reminder message for the client. This should be a friendly, professional message ready to be sent.'),
  reminderTiming: z.string().describe('The timing of the reminder (e.g., 1 hour before, 1 day before).'),
  reminderFormat: z.string().describe('The format of the reminder (e.g., SMS, email).'),
});
export type SmartReminderOutput = z.infer<typeof SmartReminderOutputSchema>;

export async function generateReminder(input: SmartReminderInput): Promise<SmartReminderOutput> {
  return smartReminderFlow(input);
}

const smartReminderPrompt = ai.definePrompt({
  name: 'smartReminderPrompt',
  input: {schema: SmartReminderInputSchema},
  output: {schema: SmartReminderOutputSchema},
  prompt: `You are an AI assistant for a business, designed to generate smart appointment reminders for clients.

  The reminder should be scheduled for 48 hours before the appointment.

  Based on the customer's past booking data and user behavior data, determine the optimal format for the reminder.
  Consider factors such as the customer's preferred communication channel.

  Customer Name: {{{customerName}}}
  Appointment Date/Time: {{{appointmentDateTime}}}
  Past Booking Data: {{{pastBookingData}}}
  User Behavior Data: {{{userBehaviorData}}}

  Generate a reminder message for the client.
  Specify the reminder timing as "48 hours before the appointment".
  Choose the most appropriate reminder format (e.g., SMS, email).
`,
});

const smartReminderFlow = ai.defineFlow(
  {
    name: 'smartReminderFlow',
    inputSchema: SmartReminderInputSchema,
    outputSchema: SmartReminderOutputSchema,
  },
  async input => {
    const {output} = await smartReminderPrompt(input);
    return output!;
  }
);


// Follow-up Reminder Flow
const FollowUpReminderInputSchema = z.object({
    customerName: z.string().describe("The name of the customer."),
    pastBookingData: z.string().describe("Past booking data, which might include service types like 'trim', 'color', etc."),
});
export type FollowUpReminderInput = z.infer<typeof FollowUpReminderInputSchema>;

const FollowUpReminderOutputSchema = z.object({
    title: z.string().describe("A short, catchy title for the follow-up reminder (e.g., 'Time for a trim!')."),
    message: z.string().describe("A friendly, engaging message to encourage the client to book their next appointment."),
    weeksAfter: z.number().describe("The recommended number of weeks after the last appointment to send this reminder."),
});
export type FollowUpReminderOutput = z.infer<typeof FollowUpReminderOutputSchema>;


export async function generateFollowUpReminder(input: FollowUpReminderInput): Promise<FollowUpReminderOutput> {
    return followUpReminderFlow(input);
}

const followUpReminderPrompt = ai.definePrompt({
    name: 'followUpReminderPrompt',
    input: { schema: FollowUpReminderInputSchema },
    output: { schema: FollowUpReminderOutputSchema },
    prompt: `You are an AI assistant for a service business (like a salon or clinic) that suggests proactive follow-up reminders to re-engage clients.

    Based on the client's past booking data, suggest a relevant follow-up.
    For example, if they often get a 'trim', suggest it's 'Time for a trim!'.
    
    If no specific recurring service is mentioned, create a general 'we miss you' style follow-up.

    Suggest an appropriate time interval in weeks. For a haircut trim, 6-8 weeks is typical. For a general check-in, maybe 12 weeks.

    Client Name: {{{customerName}}}
    Past Booking Data: {{{pastBookingData}}}
    
    Generate a compelling title, a friendly message, and a recommended number of weeks for the follow-up.`,
});

const followUpReminderFlow = ai.defineFlow(
    {
        name: 'followUpReminderFlow',
        inputSchema: FollowUpReminderInputSchema,
        outputSchema: FollowUpReminderOutputSchema,
    },
    async (input) => {
        const { output } = await followUpReminderPrompt(input);
        return output!;
    }
);
