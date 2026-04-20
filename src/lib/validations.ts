/**
 * src/lib/validations.ts
 * Zod schemas for every entity — used in API routes to validate request bodies.
 * Keeps API routes clean and ensures no malformed data reaches the database.
 */

import { z } from 'zod';

// ─── Client ───────────────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  name:         z.string().min(1, 'Name is required').max(255),
  businessName: z.string().min(1, 'Business name is required').max(255),
  phone:        z.string().max(50).optional().nullable(),
  email:        z.string().email('Invalid email').max(255).optional().nullable(),
  location:     z.string().max(500).optional().nullable(),
  avatarUrl:    z.string().max(1000).optional().nullable(),
  notes:        z.string().max(5000).optional().nullable(),
});

export const updateClientSchema = z.object({
  id: z.string().min(1, 'ID is required'),
}).merge(createClientSchema.partial());

export const deleteByIdSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

// ─── Website ──────────────────────────────────────────────────────────────────

export const createWebsiteSchema = z.object({
  clientId:        z.string().min(1, 'clientId is required'),
  domainName:      z.string().min(1, 'Domain name is required').max(255),
  // Fix: z.string().url() rejects empty strings and bare domains (e.g. "example.com")
  // causing silent 400 errors when users submit websites without a full URL.
  url:             z.string().max(500).optional().nullable(),
  hostingProvider: z.string().max(255).optional().nullable(),
  platform:        z.enum(['WordPress', 'Shopify', 'Custom', 'Other']).optional().nullable(),
  dateCreated:     z.string().optional().nullable(),
  projectPrice:    z.number().nonnegative().optional().nullable(),
  paymentStatus:   z.enum(['Paid', 'Unpaid']).optional().nullable(),
  expiryDate:      z.string().optional().nullable(),
});

export const updateWebsiteSchema = z.object({
  id: z.string().min(1),
}).merge(createWebsiteSchema.omit({ clientId: true }).partial());

// ─── Credential ───────────────────────────────────────────────────────────────

export const createCredentialSchema = z.object({
  clientId: z.string().min(1, 'clientId is required'),
  type:     z.enum(['cPanel', 'Hosting', 'Domain Registrar', 'WordPress Admin', 'Other']),
  username: z.string().min(1, 'Username is required').max(255),
  password: z.string().min(1, 'Password is required').max(1000),
  // Fix: same as website url — accept any string, not just strict RFC URLs
  url:      z.string().max(500).optional().nullable(),
});

// ─── Task ─────────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  clientId:    z.string().min(1, 'clientId is required'),
  description: z.string().min(1, 'Description is required').max(2000),
  status:      z.enum(['Pending', 'In Progress', 'Completed']).default('Pending'),
  dueDate:     z.string().optional().nullable(),
});

export const updateTaskSchema = z.object({
  id:     z.string().min(1, 'ID is required'),
  status: z.enum(['Pending', 'In Progress', 'Completed']).optional(),
  description: z.string().min(1).max(2000).optional(),
  dueDate: z.string().optional().nullable(),
});

// ─── Reminder ─────────────────────────────────────────────────────────────────

export const createReminderSchema = z.object({
  type:    z.enum(['Web Management', 'Domain', 'Hosting', 'Payment']),
  title:   z.string().min(1, 'Title is required').max(255),
  date:    z.string().min(1, 'Date is required'),
  details: z.string().max(2000).optional().nullable(),
});

// ─── Payment ──────────────────────────────────────────────────────────────────

export const createPaymentSchema = z.object({
  clientId:      z.string().min(1, 'clientId is required'),
  amount:        z.number().nonnegative('Amount must be non-negative'),
  status:        z.enum(['PAID', 'PENDING']),
  paymentDate:   z.string().min(1, 'Payment date is required'),
  description:   z.string().max(2000).optional().nullable(),
  invoiceNumber: z.string().max(100).optional().nullable(),
});

export const updatePaymentSchema = z.object({
  id: z.string().min(1, 'ID is required'),
}).merge(createPaymentSchema.omit({ clientId: true }).partial());

// ─── Shared ───────────────────────────────────────────────────────────────────

/** Standard API error response shape */
export type ApiError = { error: string; details?: unknown };
