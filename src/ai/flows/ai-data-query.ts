'use server';
/**
 * @fileOverview AI assistant flow for answering natural-language queries about
 * the TGNE dashboard data.
 *
 * Replaced the old stub (hardcoded string-matching + fake setTimeout delay)
 * with a real Genkit / Gemini prompt — consistent with ai-action-execution.ts.
 *
 * - aiDataQuery           – public function called by ai-chat.tsx
 * - AIDataQueryInput      – input type (plain string query)
 * - AIDataQueryOutput     – response type (message + optional action + parameters)
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIDataQueryInputSchema = z
  .string()
  .describe('The natural language query from the user.');

export type AIDataQueryInput = z.infer<typeof AIDataQueryInputSchema>;

const AIDataQueryOutputSchema = z.object({
  message: z.string().describe("The AI assistant's natural-language response."),
  action: z
    .string()
    .optional()
    .describe(
      "The action the AI intends to perform, e.g. 'filterClients', 'showRenewals', 'addTask'. Omit if no actionable intent is detected.",
    ),
  parameters: z
    .record(z.any())
    .optional()
    .describe('Key-value pairs of parameters extracted from the query.'),
});

export type AIDataQueryOutput = z.infer<typeof AIDataQueryOutputSchema>;

// ─── Prompt ───────────────────────────────────────────────────────────────────

const aiDataQueryPrompt = ai.definePrompt({
  name: 'aiDataQueryPrompt',
  input:  { schema: AIDataQueryInputSchema },
  output: { schema: AIDataQueryOutputSchema },
  prompt: `You are TGNE Assistant — a concise, knowledgeable AI for a web-agency dashboard.
The dashboard tracks: Clients, Websites (with renewal dates), Invoices/Payments, Tasks, and Reminders.
All monetary values are in GHS (Ghanaian Cedi).

Your job is to respond to the user's query with:
1. A helpful, natural-language "message" (always required).
2. An optional "action" string if you identify an actionable intent:
   - "filterClients"  → list/filter clients (pass parameters like paymentStatus, status, etc.)
   - "showRenewals"   → show expiring domains (pass timeFrame: "soon" | "nextMonth" | "all")
   - "addTask"        → queue a task creation (pass clientName and taskDescription if found)
   - "showInvoices"   → show invoices (pass status: "PENDING" | "PAID" | "all")
3. Optional "parameters" as a JSON object matching the chosen action.

If the query is conversational or about topics outside the dashboard, just answer naturally
with no action or parameters. Never fabricate client names or data — you do not have access
to the live database in this prompt.

User query: {{{input}}}`,
});

// ─── Flow ─────────────────────────────────────────────────────────────────────

const aiDataQueryFlow = ai.defineFlow(
  {
    name: 'aiDataQueryFlow',
    inputSchema:  AIDataQueryInputSchema,
    outputSchema: AIDataQueryOutputSchema,
  },
  async (query) => {
    const { output } = await aiDataQueryPrompt(query);
    return output!;
  },
);

// ─── Public entry-point ───────────────────────────────────────────────────────

export async function aiDataQuery(input: AIDataQueryInput): Promise<AIDataQueryOutput> {
  return aiDataQueryFlow(input);
}
