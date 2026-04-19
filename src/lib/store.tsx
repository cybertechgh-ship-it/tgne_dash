"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppData, Client, Website, Credential, Task, Reminder } from './types';
import { INITIAL_DATA } from './mock-data';

interface AppContextType {
  data: AppData;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addWebsite: (website: Omit<Website, 'id'>) => void;
  addCredential: (credential: Omit<Credential, 'id'>) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, status: Task['status']) => void;
  exportData: () => void;
  importData: (jsonData: string) => void;
  resetData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('devdash_data');
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load local data", e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('devdash_data', JSON.stringify(data));
    }
  }, [data, isInitialized]);

  const addClient = (client: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...client,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString().split('T')[0]
    };
    setData(prev => ({ ...prev, clients: [...prev.clients, newClient] }));
  };

  const updateClient = (id: string, client: Partial<Client>) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === id ? { ...c, ...client } : c)
    }));
  };

  const deleteClient = (id: string) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id),
      websites: prev.websites.filter(w => w.clientId !== id),
      credentials: prev.credentials.filter(cr => cr.clientId !== id),
      tasks: prev.tasks.filter(t => t.clientId !== id)
    }));
  };

  const addWebsite = (website: Omit<Website, 'id'>) => {
    const newWebsite: Website = {
      ...website,
      id: Math.random().toString(36).substr(2, 9)
    };
    setData(prev => ({ ...prev, websites: [...prev.websites, newWebsite] }));
  };

  const addCredential = (credential: Omit<Credential, 'id'>) => {
    const newCredential: Credential = {
      ...credential,
      id: Math.random().toString(36).substr(2, 9),
      password: btoa(credential.password) // Simulated encryption
    };
    setData(prev => ({ ...prev, credentials: [...prev.credentials, newCredential] }));
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9)
    };
    setData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const updateTask = (id: string, status: Task['status']) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, status } : t)
    }));
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devdash-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      setData(parsed);
    } catch (e) {
      alert("Invalid JSON format");
    }
  };

  const resetData = () => {
    if (confirm("Reset all data to sample data?")) {
      setData(INITIAL_DATA);
    }
  };

  return (
    <AppContext.Provider value={{ 
      data, 
      addClient, 
      updateClient, 
      deleteClient, 
      addWebsite, 
      addCredential, 
      addTask, 
      updateTask,
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