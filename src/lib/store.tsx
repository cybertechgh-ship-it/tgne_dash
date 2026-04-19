
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AppData, Client, Website, Credential, Task, Reminder, Payment } from './types';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection } from '@/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface AppContextType {
  data: AppData;
  isLoading: boolean;
  isAuthorized: boolean;
  verifyPin: (pin: string) => boolean;
  logout: () => void;
  addClient: (client: Partial<Client>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addWebsite: (website: Partial<Website>) => void;
  addCredential: (credential: Partial<Credential>) => void;
  addTask: (task: Partial<Task>) => void;
  updateTask: (id: string, status: Task['status']) => void;
  addReminder: (reminder: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  addPayment: (payment: Partial<Payment>) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ADMIN_PIN = "1234567a";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const db = useFirestore();

  // Firestore Collections
  const clientsColl = useCollection<Client>(db ? collection(db, 'clients') : null);
  const websitesColl = useCollection<Website>(db ? collection(db, 'websites') : null);
  const credentialsColl = useCollection<Credential>(db ? collection(db, 'credentials') : null);
  const tasksColl = useCollection<Task>(db ? collection(db, 'tasks') : null);
  const remindersColl = useCollection<Reminder>(db ? collection(db, 'reminders') : null);
  const paymentsColl = useCollection<Payment>(db ? collection(db, 'payments') : null);

  useEffect(() => {
    const authSession = localStorage.getItem('tgne_auth_session');
    if (authSession === 'true') {
      setIsAuthorized(true);
    }
  }, []);

  const data: AppData = useMemo(() => ({
    clients: clientsColl.data || [],
    websites: websitesColl.data || [],
    credentials: credentialsColl.data || [],
    tasks: tasksColl.data || [],
    reminders: remindersColl.data || [],
    payments: paymentsColl.data || [],
  }), [clientsColl.data, websitesColl.data, credentialsColl.data, tasksColl.data, remindersColl.data, paymentsColl.data]);

  const isLoading = clientsColl.loading || websitesColl.loading;

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

  // Mutations
  const addClient = (client: Partial<Client>) => {
    if (!db) return;
    addDoc(collection(db, 'clients'), {
      ...client,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).catch(e => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'clients', operation: 'create'
      }));
    });
  };

  const updateClient = (id: string, client: Partial<Client>) => {
    if (!db) return;
    updateDoc(doc(db, 'clients', id), {
      ...client,
      updatedAt: new Date().toISOString()
    });
  };

  const deleteClient = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'clients', id));
  };

  const addWebsite = (website: Partial<Website>) => {
    if (!db) return;
    addDoc(collection(db, 'websites'), website);
  };

  const addCredential = (credential: Partial<Credential>) => {
    if (!db) return;
    addDoc(collection(db, 'credentials'), {
      ...credential,
      password: btoa(credential.password || '')
    });
  };

  const addTask = (task: Partial<Task>) => {
    if (!db) return;
    addDoc(collection(db, 'tasks'), task);
  };

  const updateTask = (id: string, status: Task['status']) => {
    if (!db) return;
    updateDoc(doc(db, 'tasks', id), { status });
  };

  const addReminder = (reminder: Partial<Reminder>) => {
    if (!db) return;
    addDoc(collection(db, 'reminders'), reminder);
  };

  const deleteReminder = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'reminders', id));
  };

  const addPayment = (payment: Partial<Payment>) => {
    if (!db) return;
    addDoc(collection(db, 'payments'), {
      ...payment,
      createdAt: new Date().toISOString()
    });
  };

  const updatePayment = (id: string, updates: Partial<Payment>) => {
    if (!db) return;
    updateDoc(doc(db, 'payments', id), updates);
  };

  const deletePayment = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'payments', id));
  };

  return (
    <AppContext.Provider value={{ 
      data, 
      isLoading,
      isAuthorized,
      verifyPin,
      logout,
      addClient, 
      updateClient, 
      deleteClient, 
      addWebsite, 
      addCredential, 
      addTask, 
      updateTask,
      addReminder,
      deleteReminder,
      addPayment,
      updatePayment,
      deletePayment
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
