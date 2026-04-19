export interface Client {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
}

export interface Website {
  id: string;
  clientId: string;
  domainName: string;
  url: string;
  hostingProvider: string;
  platform: 'WordPress' | 'Custom' | 'Shopify' | 'Other';
  dateCreated: string;
  projectPrice: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  expiryDate?: string;
}

export interface Credential {
  id: string;
  clientId: string;
  type: 'cPanel' | 'Hosting' | 'Domain Registrar' | 'WordPress Admin' | 'Other';
  username: string;
  password: string; // Stored as simulated encrypted (base64)
  url?: string;
}

export interface Task {
  id: string;
  clientId: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  dueDate: string;
}

export interface Reminder {
  id: string;
  type: 'Domain' | 'Hosting' | 'Payment' | 'Task';
  title: string;
  date: string;
  isRead: boolean;
}

export interface AppData {
  clients: Client[];
  websites: Website[];
  credentials: Credential[];
  tasks: Task[];
  reminders: Reminder[];
}