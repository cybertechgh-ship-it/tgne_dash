
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  businessName: string;
  location: string;
  notes?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Website {
  id: string;
  clientId: string;
  domainName: string;
  url: string;
  platform: 'WordPress' | 'Shopify' | 'Custom' | 'Other';
  hostingProvider: string;
  dateCreated: string;
  projectPrice: number;
  paymentStatus: 'Paid' | 'Unpaid';
  expiryDate?: string;
}

export interface Credential {
  id: string;
  clientId: string;
  type: 'cPanel' | 'Hosting' | 'Domain Registrar' | 'WordPress Admin' | 'Other';
  username: string;
  password: string;
  url?: string;
}

export interface Payment {
  id: string;
  clientId: string;
  amount: number;
  status: 'PAID' | 'PENDING';
  paymentDate: string;
  description: string;
  invoiceNumber: string;
  createdAt: string;
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
  type: 'Web Management' | 'Domain' | 'Hosting' | 'Payment';
  title: string;
  date: string;
  details: string;
  isRead: boolean; // exists in DB schema — was missing from this type
}

export interface AppData {
  clients: Client[];
  websites: Website[];
  credentials: Credential[];
  tasks: Task[];
  reminders: Reminder[];
  payments: Payment[];
}
