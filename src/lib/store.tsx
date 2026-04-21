"use client";

/**
 * src/lib/store.tsx
 * Global app state — powered by TanStack Query for caching + invalidation.
 */

import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AppData, Client, Website, Credential, Task, Reminder, Payment } from './types';
import { queryKeys } from './query-client';
import { toast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type SavingState = 'saving' | 'deleting' | 'updating' | null;

interface AppContextType {
  data: AppData;
  isLoading: boolean;
  isSaving: boolean;
  savingState: SavingState;
  isAuthorized: boolean;
  verifyPin:       (pin: string) => boolean;
  logout:          () => void;
  addClient:       (client: Partial<Client>) => Promise<Client | null>;
  updateClient:    (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient:    (id: string) => Promise<void>;
  addWebsite:      (website: Partial<Website>) => Promise<void>;
  updateWebsite:   (id: string, website: Partial<Website>) => Promise<void>;
  deleteWebsite:   (id: string) => Promise<void>;
  addCredential:   (credential: Partial<Credential>) => Promise<void>;
  deleteCredential:(id: string) => Promise<void>;
  addTask:         (task: Partial<Task>) => Promise<void>;
  updateTask:      (id: string, status: Task['status']) => Promise<void>;
  deleteTask:      (id: string) => Promise<void>;
  addReminder:     (reminder: Partial<Reminder>) => Promise<void>;
  markReminderRead:(id: string) => Promise<void>;
  deleteReminder:  (id: string) => Promise<void>;
  addPayment:      (payment: Partial<Payment>) => Promise<void>;
  updatePayment:   (id: string, updates: Partial<Payment>) => Promise<void>;
  deletePayment:   (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ADMIN_PIN = "1234567a";

const EMPTY_DATA: AppData = {
  clients: [], websites: [], credentials: [],
  tasks: [], reminders: [], payments: [],
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

const api = {
  get: (path: string) =>
    fetch(path).then(r => {
      if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
      return r.json();
    }),
  post: (path: string, body: unknown) =>
    fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  put: (path: string, body: unknown) =>
    fetch(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  del: (path: string, body: unknown) =>
    fetch(path, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
};

async function readErrorText(r: Response): Promise<string> {
  try {
    const text = await r.text();
    try {
      const json = JSON.parse(text);
      if (json?.details?.fieldErrors) {
        const msgs = Object.entries(json.details.fieldErrors)
          .map(([field, errs]) => `${field}: ${(errs as string[]).join(', ')}`)
          .join(' | ');
        return msgs || json.error || text;
      }
      return json.error || text;
    } catch { return text; }
  } catch { return `HTTP ${r.status}`; }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router      = useRouter();
  const queryClient = useQueryClient();

  const [isAuthorized, setIsAuthorized] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('tgne_auth_session') === 'true';
  });

  const [savingState, setSavingState] = React.useState<SavingState>(null);

  const { data = EMPTY_DATA, isLoading, error: dataError } = useQuery<AppData>({
    queryKey: queryKeys.allData,
    queryFn: () => api.get('/api/data'),
    staleTime: 30 * 1000,
    gcTime:    5 * 60 * 1000,
    retry: 2,
  });

  useEffect(() => {
    if (dataError) {
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: 'Could not load data from the database. Check your connection.',
      });
    }
  }, [dataError]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.allData });

  const handleError = (ctx: string, error: unknown) => {
    console.error(`[${ctx}]`, error);
    const msg = error instanceof Error ? error.message : String(error);
    toast({ variant: 'destructive', title: `"${ctx}" failed`, description: msg || 'Please try again.' });
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  const verifyPin = (pin: string) => {
    if (pin === ADMIN_PIN) {
      setIsAuthorized(true);
      localStorage.setItem('tgne_auth_session', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthorized(false);
    localStorage.removeItem('tgne_auth_session');
    router.push('/tgnes');
  };

  // ── Clients ───────────────────────────────────────────────────────────────
  const addClient = async (client: Partial<Client>): Promise<Client | null> => {
    setSavingState('saving');
    try {
      const r = await api.post('/api/clients', client);
      if (!r.ok) throw new Error(await readErrorText(r));
      const newClient: Client = await r.json();
      await invalidate();
      toast({ title: 'Success', description: 'Client added successfully!' });
      return newClient;
    } catch (e) { handleError('addClient', e); return null; }
    finally     { setSavingState(null); }
  };

  const updateClient = async (id: string, client: Partial<Client>) => {
    setSavingState('updating');
    try {
      const r = await api.put('/api/clients', { id, ...client });
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Success', description: 'Client updated!' });
    } catch (e) { handleError('updateClient', e); }
    finally     { setSavingState(null); }
  };

  const deleteClient = async (id: string) => {
    setSavingState('deleting');
    try {
      const r = await api.del('/api/clients', { id });
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Deleted', description: 'Client removed.' });
    } catch (e) { handleError('deleteClient', e); }
    finally     { setSavingState(null); }
  };

  // ── Websites ──────────────────────────────────────────────────────────────
  const addWebsite = async (website: Partial<Website>) => {
    setSavingState('saving');
    try {
      const r = await api.post('/api/websites', website);
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
    } catch (e) { handleError('addWebsite', e); }
    finally     { setSavingState(null); }
  };

  const updateWebsite = async (id: string, website: Partial<Website>) => {
    setSavingState('updating');
    try {
      const r = await api.put('/api/websites', { id, ...website });
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Updated', description: 'Website updated!' });
    } catch (e) { handleError('updateWebsite', e); }
    finally     { setSavingState(null); }
  };

  const deleteWebsite = async (id: string) => {
    setSavingState('deleting');
    try {
      const r = await api.del('/api/websites', { id });
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Deleted', description: 'Website removed.' });
    } catch (e) { handleError('deleteWebsite', e); }
    finally     { setSavingState(null); }
  };

  // ── Credentials ───────────────────────────────────────────────────────────
  const addCredential = async (credential: Partial<Credential>) => {
    setSavingState('saving');
    try {
      const r = await api.post('/api/credentials', credential);
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Secured', description: 'Credential saved to vault!' });
    } catch (e) { handleError('addCredential', e); }
    finally     { setSavingState(null); }
  };

  const deleteCredential = async (id: string) => {
    setSavingState('deleting');
    try {
      const r = await api.del('/api/credentials', { id });
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Deleted', description: 'Credential removed.' });
    } catch (e) { handleError('deleteCredential', e); }
    finally     { setSavingState(null); }
  };

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const addTask = async (task: Partial<Task>) => {
    setSavingState('saving');
    try {
      const r = await api.post('/api/tasks', task);
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Success', description: 'Task created!' });
    } catch (e) { handleError('addTask', e); }
    finally     { setSavingState(null); }
  };

  const updateTask = async (id: string, status: Task['status']) => {
    setSavingState('updating');
    try {
      const r = await api.put('/api/tasks', { id, status });
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Updated', description: `Task marked as ${status}` });
    } catch (e) { handleError('updateTask', e); }
    finally     { setSavingState(null); }
  };

  const deleteTask = async (id: string) => {
    setSavingState('deleting');
    try {
      const r = await api.del('/api/tasks', { id });
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Deleted', description: 'Task removed.' });
    } catch (e) { handleError('deleteTask', e); }
    finally     { setSavingState(null); }
  };

  // ── Reminders ─────────────────────────────────────────────────────────────
  const addReminder = async (reminder: Partial<Reminder>) => {
    setSavingState('saving');
    try {
      const r = await api.post('/api/reminders', reminder);
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Set', description: 'Reminder scheduled!' });
    } catch (e) { handleError('addReminder', e); }
    finally     { setSavingState(null); }
  };

  const markReminderRead = async (id: string) => {
    setSavingState('updating');
    try {
      const r = await api.put('/api/reminders', { id, isRead: true });
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
    } catch (e) { handleError('markReminderRead', e); }
    finally     { setSavingState(null); }
  };

  const deleteReminder = async (id: string) => {
    setSavingState('deleting');
    try {
      const r = await api.del('/api/reminders', { id });
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Removed', description: 'Reminder deleted.' });
    } catch (e) { handleError('deleteReminder', e); }
    finally     { setSavingState(null); }
  };

  // ── Payments ──────────────────────────────────────────────────────────────
  const addPayment = async (payment: Partial<Payment>) => {
    setSavingState('saving');
    try {
      const r = await api.post('/api/payments', payment);
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Invoice Created', description: 'New invoice saved!' });
    } catch (e) { handleError('addPayment', e); }
    finally     { setSavingState(null); }
  };

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    setSavingState('updating');
    try {
      const r = await api.put('/api/payments', { id, ...updates });
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Updated', description: 'Invoice updated!' });
    } catch (e) { handleError('updatePayment', e); }
    finally     { setSavingState(null); }
  };

  const deletePayment = async (id: string) => {
    setSavingState('deleting');
    try {
      const r = await api.del('/api/payments', { id });
      if (!r.ok) throw new Error(await readErrorText(r));
      await invalidate();
      toast({ title: 'Deleted', description: 'Invoice removed.' });
    } catch (e) { handleError('deletePayment', e); }
    finally     { setSavingState(null); }
  };

  return (
    <AppContext.Provider
      value={{
        data,
        isLoading,
        isSaving: savingState !== null,
        savingState,
        isAuthorized,
        verifyPin,
        logout,
        addClient,
        updateClient,
        deleteClient,
        addWebsite,
        updateWebsite,
        deleteWebsite,
        addCredential,
        deleteCredential,
        addTask,
        updateTask,
        deleteTask,
        addReminder,
        markReminderRead,
        deleteReminder,
        addPayment,
        updatePayment,
        deletePayment,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
