/**
 * src/db/schema.ts  — EXTENDED with audit_logs + client_files tables
 */

import {
  pgTable,
  text,
  real,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

const cuid = () => createId();

// ─── Client ───────────────────────────────────────────────────────────────────

export const clients = pgTable(
  'Client',
  {
    id:               text('id').primaryKey().$defaultFn(cuid),
    name:             text('name').notNull(),
    businessName:     text('businessName').notNull(),
    businessType:     text('businessType'),
    industry:         text('industry'),
    email:            text('email'),
    phone:            text('phone'),
    preferredContact: text('preferredContact'),
    country:          text('country'),
    city:             text('city'),
    location:         text('location'),
    avatarUrl:        text('avatarUrl'),
    notes:            text('notes'),
    status:           text('status').default('Active'),
    accountManager:   text('accountManager'),
    tags:             text('tags'),
    currency:         text('currency').default('GHS'),
    vatEnabled:       boolean('vatEnabled').default(false),
    paymentTerms:     text('paymentTerms'),
    preferredPayment: text('preferredPayment'),
    createdAt: timestamp('createdAt', { precision: 3, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  },
  (t) => ({
    emailIdx:  index('Client_email_idx').on(t.email),
    statusIdx: index('Client_status_idx').on(t.status),
  })
);

// ─── Website ──────────────────────────────────────────────────────────────────

export const websites = pgTable(
  'Website',
  {
    id:              text('id').primaryKey().$defaultFn(cuid),
    clientId:        text('clientId').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    domainName:      text('domainName').notNull(),
    url:             text('url'),
    hostingProvider: text('hostingProvider'),
    platform:        text('platform'),
    dateCreated:     timestamp('dateCreated', { precision: 3, mode: 'string' }),
    projectPrice:    real('projectPrice'),
    paymentStatus:   text('paymentStatus'),
    expiryDate:      timestamp('expiryDate', { precision: 3, mode: 'string' }),
  },
  (t) => ({
    clientIdx: index('Website_clientId_idx').on(t.clientId),
  })
);

// ─── Credential ───────────────────────────────────────────────────────────────

export const credentials = pgTable(
  'Credential',
  {
    id:       text('id').primaryKey().$defaultFn(cuid),
    clientId: text('clientId').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    type:     text('type').notNull(),
    username: text('username').notNull(),
    password: text('password').notNull(),
    url:      text('url'),
  },
  (t) => ({
    clientIdx: index('Credential_clientId_idx').on(t.clientId),
  })
);

// ─── Task ─────────────────────────────────────────────────────────────────────

export const tasks = pgTable(
  'Task',
  {
    id:          text('id').primaryKey().$defaultFn(cuid),
    clientId:    text('clientId').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    status:      text('status').default('Pending').notNull(),
    dueDate:     text('dueDate'),
  },
  (t) => ({
    clientIdx: index('Task_clientId_idx').on(t.clientId),
    statusIdx: index('Task_status_idx').on(t.status),
  })
);

// ─── Reminder ─────────────────────────────────────────────────────────────────

export const reminders = pgTable(
  'Reminder',
  {
    id:      text('id').primaryKey().$defaultFn(cuid),
    type:    text('type').notNull(),
    title:   text('title').notNull(),
    date:    text('date').notNull(),
    isRead:  boolean('isRead').default(false).notNull(),
    details: text('details'),
  },
  (t) => ({
    dateIdx: index('Reminder_date_idx').on(t.date),
  })
);

// ─── Payment ──────────────────────────────────────────────────────────────────

export const payments = pgTable(
  'Payment',
  {
    id:            text('id').primaryKey().$defaultFn(cuid),
    clientId:      text('clientId').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    amount:        real('amount').notNull(),
    status:        text('status').notNull(),
    paymentDate:   text('paymentDate').notNull(),
    description:   text('description'),
    invoiceNumber: text('invoiceNumber'),
    createdAt:     timestamp('createdAt', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  },
  (t) => ({
    clientIdx: index('Payment_clientId_idx').on(t.clientId),
    statusIdx: index('Payment_status_idx').on(t.status),
  })
);

// ─── Audit Log  (NEW) ─────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  'AuditLog',
  {
    id:         text('id').primaryKey().$defaultFn(cuid),
    action:     text('action').notNull(),      // 'CREATE' | 'UPDATE' | 'DELETE'
    entity:     text('entity').notNull(),      // 'Client' | 'Payment' | etc.
    entityId:   text('entityId').notNull(),
    entityName: text('entityName'),            // human-readable label
    details:    text('details'),               // JSON string of changed fields
    actor:      text('actor').default('TGNE Admin'),
    createdAt:  timestamp('createdAt', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  },
  (t) => ({
    entityIdx:    index('AuditLog_entity_idx').on(t.entity),
    createdAtIdx: index('AuditLog_createdAt_idx').on(t.createdAt),
  })
);

// ─── Client Files  (NEW) ──────────────────────────────────────────────────────

export const clientFiles = pgTable(
  'ClientFile',
  {
    id:          text('id').primaryKey().$defaultFn(cuid),
    clientId:    text('clientId').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    name:        text('name').notNull(),        // original filename
    url:         text('url').notNull(),         // Cloudinary URL
    publicId:    text('publicId'),              // Cloudinary public_id for deletion
    size:        real('size'),                  // bytes
    mimeType:    text('mimeType'),
    category:    text('category').default('document'), // 'document' | 'image' | 'contract' | 'brief'
    uploadedAt:  timestamp('uploadedAt', { precision: 3, mode: 'string' }).defaultNow().notNull(),
  },
  (t) => ({
    clientIdx: index('ClientFile_clientId_idx').on(t.clientId),
  })
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const clientRelations = relations(clients, ({ many }) => ({
  websites:    many(websites),
  credentials: many(credentials),
  tasks:       many(tasks),
  payments:    many(payments),
  files:       many(clientFiles),
}));

export const websiteRelations    = relations(websites,    ({ one }) => ({ client: one(clients, { fields: [websites.clientId],    references: [clients.id] }) }));
export const credentialRelations = relations(credentials, ({ one }) => ({ client: one(clients, { fields: [credentials.clientId], references: [clients.id] }) }));
export const taskRelations       = relations(tasks,       ({ one }) => ({ client: one(clients, { fields: [tasks.clientId],       references: [clients.id] }) }));
export const paymentRelations    = relations(payments,    ({ one }) => ({ client: one(clients, { fields: [payments.clientId],    references: [clients.id] }) }));
export const clientFileRelations = relations(clientFiles, ({ one }) => ({ client: one(clients, { fields: [clientFiles.clientId], references: [clients.id] }) }));

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type ClientRow    = typeof clients.$inferSelect;
export type NewClient    = typeof clients.$inferInsert;
export type WebsiteRow   = typeof websites.$inferSelect;
export type TaskRow      = typeof tasks.$inferSelect;
export type PaymentRow   = typeof payments.$inferSelect;
export type AuditLogRow  = typeof auditLogs.$inferSelect;
export type NewAuditLog  = typeof auditLogs.$inferInsert;
export type ClientFileRow = typeof clientFiles.$inferSelect;
export type NewClientFile = typeof clientFiles.$inferInsert;
