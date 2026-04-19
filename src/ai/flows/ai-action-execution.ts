'use server';
/**
 * @fileOverview This file implements a Genkit flow for the AI assistant
 * to parse natural language queries and extract structured data for actions.
 *
 * - aiActionExecution - A function that processes natural language input
 *   to determine an AI action and its parameters.
 * - AIActionExecutionInput - The input type for the aiActionExecution function.
 * - AIActionExecutionOutput - The return type for the aiActionExecution function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIActionExecutionInputSchema = z.object({
  query: z.string().describe('The natural language query from the user.'),
});
export type AIActionExecutionInput = z.infer<typeof AIActionExecutionInputSchema>;

const AIActionExecutionOutputSchema = z.object({
  actionType: z.enum(['addTask', 'filterClients', 'showDomains', 'unknown']).describe('The type of action to perform.'),
  clientName: z.string().nullable().describe('The name of the client, if applicable. Null if not specified.'),
  taskDescription: z.string().nullable().describe('The description of the task, if applicable. Null if not specified.'),
  dueDate: z.string().nullable().describe('The due date for the task, if applicable (e.g., "Friday", "tomorrow", "2024-12-31"). Null if not specified.'),
  // Add more fields here as AI capabilities grow
});
export type AIActionExecutionOutput = z.infer<typeof AIActionExecutionOutputSchema>;

export async function aiActionExecution(input: AIActionExecutionInput): Promise<AIActionExecutionOutput> {
  return aiActionExecutionFlow(input);
}

const aiActionExecutionPrompt = ai.definePrompt({
  name: 'aiActionExecutionPrompt',
  input: { schema: AIActionExecutionInputSchema },
  output: { schema: AIActionExecutionOutputSchema },
  prompt: `You are an AI assistant designed to understand natural language requests and convert them into structured JSON actions.

Here are some examples of user queries and their expected JSON output:

User: "Add task 'Review homepage' for Client X by Friday"
Output: {"actionType": "addTask", "clientName": "Client X", "taskDescription": "Review homepage", "dueDate": "Friday"}

User: "Add task 'Call Kofi about new project' for Kofi"
Output: {"actionType": "addTask", "clientName": "Kofi", "taskDescription": "Call Kofi about new project", "dueDate": null}

User: "Show clients with unpaid invoices"
Output: {"actionType": "filterClients", "clientName": null, "taskDescription": null, "dueDate": null}

User: "Which domains expire soon?"
Output: {"actionType": "showDomains", "clientName": null, "taskDescription": null, "dueDate": null}

If the query does not match a known action, set actionType to "unknown" and all other fields to null.

Now, analyze the following user query and provide the corresponding JSON output:

User: "{{{query}}}"
Output: `,
});

const aiActionExecutionFlow = ai.defineFlow(
  {
    name: 'aiActionExecutionFlow',
    inputSchema: AIActionExecutionInputSchema,
    outputSchema: AIActionExecutionOutputSchema,
  },
  async (input) => {
    const { output } = await aiActionExecutionPrompt(input);
    return output!;
  }
);
