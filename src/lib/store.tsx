
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AppData, Client, Website, Credential, Task, Renewal } from './types';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection } from '@/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  where
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
  addRenewal: (renewal: Partial<Renewal>) => void;
  deleteRenewal: (id: string) => void;
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
  const renewalsColl = useCollection<Renewal>(db ? collection(db, 'renewals') : null);

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
    renewals: renewalsColl.data || [],
  }), [clientsColl.data, websitesColl.data, credentialsColl.data, tasksColl.data, renewalsColl.data]);

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
    const clientRef = collection(db, 'clients');
    addDoc(clientRef, {
      ...client,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'clients',
        operation: 'create',
        requestResourceData: client
      }));
    });
  };

  const updateClient = (id: string, client: Partial<Client>) => {
    if (!db) return;
    const clientRef = doc(db, 'clients', id);
    updateDoc(clientRef, {
      ...client,
      updatedAt: new Date().toISOString()
    }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `clients/${id}`,
        operation: 'update',
        requestResourceData: client
      }));
    });
  };

  const deleteClient = (id: string) => {
    if (!db) return;
    const clientRef = doc(db, 'clients', id);
    deleteDoc(clientRef).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `clients/${id}`,
        operation: 'delete'
      }));
    });
  };

  const addWebsite = (website: Partial<Website>) => {
    if (!db) return;
    addDoc(collection(db, 'websites'), website).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'websites',
        operation: 'create',
        requestResourceData: website
      }));
    });
  };

  const addCredential = (credential: Partial<Credential>) => {
    if (!db) return;
    addDoc(collection(db, 'credentials'), {
      ...credential,
      password: btoa(credential.password || '') // Simulated encryption for display
    }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'credentials',
        operation: 'create',
        requestResourceData: credential
      }));
    });
  };

  const addTask = (task: Partial<Task>) => {
    if (!db) return;
    addDoc(collection(db, 'tasks'), task).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'tasks',
        operation: 'create',
        requestResourceData: task
      }));
    });
  };

  const updateTask = (id: string, status: Task['status']) => {
    if (!db) return;
    updateDoc(doc(db, 'tasks', id), { status }).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `tasks/${id}`,
        operation: 'update',
        requestResourceData: { status }
      }));
    });
  };

  const addRenewal = (renewal: Partial<Renewal>) => {
    if (!db) return;
    addDoc(collection(db, 'renewals'), renewal).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'renewals',
        operation: 'create',
        requestResourceData: renewal
      }));
    });
  };

  const deleteRenewal = (id: string) => {
    if (!db) return;
    deleteDoc(doc(db, 'renewals', id)).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `renewals/${id}`,
        operation: 'delete'
      }));
    });
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
      addRenewal,
      deleteRenewal
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
