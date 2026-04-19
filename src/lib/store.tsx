"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppData, Client, Website, Credential, Task, Reminder } from './types';
import { INITIAL_DATA } from './mock-data';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';

interface AppContextType {
  data: AppData;
  isAuthorized: boolean;
  verifyPin: (pin: string) => boolean;
  logout: () => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addWebsite: (website: Omit<Website, 'id'>) => void;
  addCredential: (credential: Omit<Credential, 'id'>) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, status: Task['status']) => void;
  addReminder: (reminder: Omit<Reminder, 'id' | 'isRead'>) => void;
  deleteReminder: (id: string) => void;
  exportData: () => void;
  importData: (jsonData: string) => void;
  resetData: (silent?: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds
const ADMIN_PIN = "1234567a";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const updateActivityTimestamp = () => {
    localStorage.setItem('devdash_last_activity', Date.now().toString());
  };

  useEffect(() => {
    const saved = localStorage.getItem('devdash_data');
    const lastActivity = localStorage.getItem('devdash_last_activity');
    const authSession = localStorage.getItem('tgne_auth_session');
    const now = Date.now();

    if (saved && lastActivity) {
      const timeDiff = now - parseInt(lastActivity);
      if (timeDiff > EXPIRY_TIME) {
        console.log("Session expired. Resetting demo data.");
        setData(INITIAL_DATA);
        setIsAuthorized(false);
        localStorage.removeItem('tgne_auth_session');
        updateActivityTimestamp();
      } else {
        try {
          setData(JSON.parse(saved));
          if (authSession === 'true') {
            setIsAuthorized(true);
          }
        } catch (e) {
          console.error("Failed to load local data", e);
        }
      }
    } else {
      updateActivityTimestamp();
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('devdash_data', JSON.stringify(data));
      updateActivityTimestamp();
    }
  }, [data, isInitialized]);

  const verifyPin = (pin: string) => {
    if (pin === ADMIN_PIN) {
      setIsAuthorized(true);
      localStorage.setItem('tgne_auth_session', 'true');
      updateActivityTimestamp();
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthorized(false);
    localStorage.removeItem('tgne_auth_session');
    router.push('/tgnes');
  };

  const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...client,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setData(prev => ({ ...prev, clients: [...prev.clients, newClient] }));
    toast({ title: "Client Created", description: `${client.businessName} has been added.` });
  };

  const updateClient = (id: string, client: Partial<Client>) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === id ? { ...c, ...client } : c)
    }));
    toast({ title: "Client Updated", description: "The client profile has been saved." });
  };

  const deleteClient = (id: string) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id),
      websites: prev.websites.filter(w => w.clientId !== id),
      credentials: prev.credentials.filter(cr => cr.clientId !== id),
      tasks: prev.tasks.filter(t => t.clientId !== id)
    }));
    toast({ title: "Client Deleted", description: "The client and all associated data were removed." });
  };

  const addWebsite = (website: Omit<Website, 'id'>) => {
    const newWebsite: Website = {
      ...website,
      id: Math.random().toString(36).substr(2, 9)
    };
    setData(prev => ({ ...prev, websites: [...prev.websites, newWebsite] }));
    toast({ title: "Project Added", description: `Website ${website.domainName} registered.` });
  };

  const addCredential = (credential: Omit<Credential, 'id'>) => {
    const newCredential: Credential = {
      ...credential,
      id: Math.random().toString(36).substr(2, 9),
      password: btoa(credential.password) // Simulated encryption
    };
    setData(prev => ({ ...prev, credentials: [...prev.credentials, newCredential] }));
    toast({ title: "Credential Secured", description: "Login details stored in the vault." });
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9)
    };
    setData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    toast({ title: "Task Created", description: "The action item has been added to your list." });
  };

  const updateTask = (id: string, status: Task['status']) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, status } : t)
    }));
  };

  const addReminder = (reminder: Omit<Reminder, 'id' | 'isRead'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: Math.random().toString(36).substr(2, 9),
      isRead: false
    };
    setData(prev => ({ ...prev, reminders: [...prev.reminders, newReminder] }));
    toast({ title: "Reminder Created", description: "Alert has been successfully scheduled." });
  };

  const deleteReminder = (id: string) => {
    setData(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r.id !== id)
    }));
    toast({ title: "Reminder Dismissed", description: "The alert has been removed." });
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tgne-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      setData(parsed);
      toast({ title: "Data Imported", description: "Application state has been restored." });
    } catch (e) {
      toast({ variant: "destructive", title: "Import Failed", description: "Invalid JSON format." });
    }
  };

  const resetData = (silent = false) => {
    if (silent || confirm("Reset all data to sample data?")) {
      setData(INITIAL_DATA);
      updateActivityTimestamp();
      if (!silent) toast({ title: "Demo Reset", description: "The dashboard has been restored to factory settings." });
    }
  };

  return (
    <AppContext.Provider value={{ 
      data, 
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
      exportData,
      importData,
      resetData
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
