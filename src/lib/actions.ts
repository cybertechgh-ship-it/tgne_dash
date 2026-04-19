'use server';

import prisma from '@/lib/prisma';
import { AppData, Client, Website, Credential, Task, Reminder, Payment } from './types';

export async function fetchAllData(): Promise<AppData> {
  // Run sequentially to avoid exhausting Neon's connection pool (P2024)
  const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
  const websites = await prisma.website.findMany();
  const credentials = await prisma.credential.findMany();
  const tasks = await prisma.task.findMany();
  const reminders = await prisma.reminder.findMany({ orderBy: { date: 'asc' } });
  const payments = await prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });

  return {
    clients: clients.map(c => ({
      ...c,
      phone: c.phone ?? undefined,
      email: c.email ?? undefined,
      location: c.location ?? '',
      avatarUrl: c.avatarUrl ?? undefined,
      notes: c.notes ?? undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    websites: websites.map(w => ({
      ...w,
      url: w.url ?? '',
      hostingProvider: w.hostingProvider ?? '',
      platform: (w.platform as Website['platform']) ?? 'Other',
      projectPrice: w.projectPrice ?? 0,
      paymentStatus: (w.paymentStatus as Website['paymentStatus']) ?? 'Unpaid',
      dateCreated: w.dateCreated?.toISOString() ?? '',
      expiryDate: w.expiryDate?.toISOString() ?? undefined,
    })),
    credentials: credentials.map(c => ({
      ...c,
      type: c.type as Credential['type'],
      url: c.url ?? undefined,
    })),
    tasks: tasks.map(t => ({
      ...t,
      status: (t.status as Task['status']) ?? 'Pending',
      dueDate: t.dueDate ?? '',
    })),
    reminders: reminders.map(r => ({
      ...r,
      type: r.type as Reminder['type'],
      details: r.details ?? '',
    })),
    payments: payments.map(p => ({
      ...p,
      paymentDate: p.paymentDate || '',
      description: p.description || '',
      invoiceNumber: p.invoiceNumber || '',
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

// Clients
export async function createClient(data: Partial<Client>) {
  return prisma.client.create({
    data: {
      name: data.name!,
      businessName: data.businessName!,
      phone: data.phone,
      email: data.email,
      location: data.location,
      avatarUrl: data.avatarUrl,
      notes: data.notes,
    }
  });
}

export async function updateClientAction(id: string, data: Partial<Client>) {
  return prisma.client.update({
    where: { id },
    data: {
      name: data.name,
      businessName: data.businessName,
      phone: data.phone,
      email: data.email,
      location: data.location,
      avatarUrl: data.avatarUrl,
      notes: data.notes,
    }
  });
}

export async function deleteClientAction(id: string) {
  return prisma.client.delete({ where: { id } });
}

// Websites
export async function createWebsite(data: Partial<Website>) {
  return prisma.website.create({
    data: {
      clientId: data.clientId!,
      domainName: data.domainName!,
      url: data.url ?? null,
      hostingProvider: data.hostingProvider ?? null,
      platform: data.platform ?? null,
      projectPrice: data.projectPrice ?? null,
      paymentStatus: data.paymentStatus ?? null,
      dateCreated: data.dateCreated ? new Date(data.dateCreated) : null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    }
  });
}

// Credentials
export async function createCredential(data: Partial<Credential>) {
  return prisma.credential.create({
    data: {
      clientId: data.clientId!,
      type: data.type!,
      username: data.username!,
      password: Buffer.from(data.password || '').toString('base64'),
      url: data.url ?? null,
    }
  });
}

// Tasks
export async function createTask(data: Partial<Task>) {
  return prisma.task.create({
    data: {
      clientId: data.clientId!,
      description: data.description!,
      status: data.status || 'Pending',
      dueDate: data.dueDate,
    }
  });
}

export async function updateTaskAction(id: string, status: string) {
  return prisma.task.update({
    where: { id },
    data: { status }
  });
}

// Reminders
export async function createReminder(data: Partial<Reminder>) {
  return prisma.reminder.create({
    data: {
      type: data.type!,
      title: data.title!,
      date: data.date!,
      details: data.details ?? null,
    }
  });
}

export async function deleteReminderAction(id: string) {
  return prisma.reminder.delete({ where: { id } });
}

// Payments
export async function createPayment(data: Partial<Payment>) {
  return prisma.payment.create({
    data: {
      clientId: data.clientId!,
      amount: data.amount!,
      status: data.status!,
      paymentDate: data.paymentDate!,
      description: data.description || null,
      invoiceNumber: data.invoiceNumber || null,
    }
  });
}

export async function updatePaymentAction(id: string, updates: Partial<Payment>) {
  return prisma.payment.update({
    where: { id },
    data: {
      ...(updates.amount !== undefined && { amount: updates.amount }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.paymentDate !== undefined && { paymentDate: updates.paymentDate }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.invoiceNumber !== undefined && { invoiceNumber: updates.invoiceNumber }),
    }
  });
}

export async function deletePaymentAction(id: string) {
  return prisma.payment.delete({ where: { id } });
}