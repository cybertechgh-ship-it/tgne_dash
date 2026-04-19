'use server';
/**
 * @fileOverview A simulated AI assistant for querying local data in the DevDash Connect dashboard.
 *
 * - aiDataQuery - A function that processes natural language queries to simulate AI actions.
 * - AIDataQueryInput - The input type for the aiDataQuery function.
 * - AIDataQueryOutput - The return type for the aiDataQuery function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIDataQueryInputSchema = z.string().describe('The natural language query from the user.');
export type AIDataQueryInput = z.infer<typeof AIDataQueryInputSchema>;

const AIDataQueryOutputSchema = z.object({
  message: z.string().describe("The AI's natural language response."),
  action: z.string().optional().describe("The action the AI intends to perform (e.g., 'filterClients', 'showRenewals', 'addTask')."),
  parameters: z.record(z.any()).optional().describe("Key-value pairs of parameters extracted from the query.")
});
export type AIDataQueryOutput = z.infer<typeof AIDataQueryOutputSchema>;

export async function aiDataQuery(input: AIDataQueryInput): Promise<AIDataQueryOutput> {
  return aiDataQueryFlow(input);
}

const aiDataQueryFlow = ai.defineFlow(
  {
    name: 'aiDataQueryFlow',
    inputSchema: AIDataQueryInputSchema,
    outputSchema: AIDataQueryOutputSchema,
  },
  async (query) => {
    const lowerCaseQuery = query.toLowerCase();
    let message = "I'm sorry, I couldn't understand that query. Please try rephrasing it.";
    let action: string | undefined;
    let parameters: Record<string, any> | undefined;

    // Simulate a delay for realism
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500)); // 0.8s to 1.3s delay

    if (lowerCaseQuery.includes('clients') && lowerCaseQuery.includes('unpaid invoices')) {
      action = 'filterClients';
      parameters = { paymentStatus: 'unpaid' };
      message = "Here are the clients with unpaid invoices.";
    } else if (lowerCaseQuery.includes('domains') && lowerCaseQuery.includes('expire soon')) {
      action = 'showRenewals';
      parameters = { type: 'domain', timeFrame: 'soon' };
      message = "Checking for domains expiring soon.";
    } else if (lowerCaseQuery.includes('domains') && lowerCaseQuery.includes('expire next month')) {
      action = 'showRenewals';
      parameters = { type: 'domain', timeFrame: 'nextMonth' };
      message = "Here are the domains expiring next month.";
    } else if (lowerCaseQuery.includes('add task for')) {
      const clientNameMatch = /add task for\s+([a-zA-Z0-9\s]+)/.exec(lowerCaseQuery);
      if (clientNameMatch && clientNameMatch[1]) {
        const clientName = clientNameMatch[1].trim();
        action = 'addTask';
        parameters = { clientName: clientName };
        message = `Okay, I'll prepare to add a task for ${clientName}. What is the task?`;
      } else {
        message = "To add a task, please specify the client. For example: 'Add task for Kofi'.";
      }
    } else if (lowerCaseQuery.includes('show all clients')) {
      action = 'filterClients';
      parameters = { paymentStatus: 'all' }; // Or simply clear filters in the UI
      message = "Displaying all clients.";
    } else if (lowerCaseQuery.includes('show active projects') || lowerCaseQuery.includes('show active websites')) {
      action = 'filterProjects';
      parameters = { status: 'active' };
      message = "Here are your active website projects.";
    } else if (lowerCaseQuery.includes('what is the weather')) {
      message = "I am an assistant for client and project management. I cannot tell you about the weather.";
    }

    return {
      message,
      action,
      parameters,
    };
  }
);
