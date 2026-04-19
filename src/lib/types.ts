
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName: string;
  notes?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Website {
  id: string;
  clientId: string;
  domain: string;
  url: string;
  platform: 'WordPress' | 'Shopify' | 'Custom' | 'Other';
  hostingProvider: string;
  dateCreated: string;
  projectPrice: number;
  paymentStatus: 'PAID' | 'PENDING';
  expiryDate?: string;
}

export interface Credential {
  id: string;
  websiteId: string;
  clientId: string;
  type: 'CPANEL' | 'HOSTING' | 'DOMAIN' | 'WORDPRESS' | 'FTP' | 'Other';
  username: string;
  password: string;
  notes?: string;
}

export interface Payment {
  id: string;
  clientId: string;
  websiteId?: string;
  amount: number;
  status: 'PAID' | 'PENDING';
  paymentDate?: string;
  receiptUrl?: string;
}

export interface Renewal {
  id: string;
  websiteId: string;
  type: 'DOMAIN' | 'HOSTING' | 'SSL';
  expiryDate: string;
  reminderDays: number[];
  lastNotifiedAt?: string;
}

export interface Task {
  id: string;
  clientId: string;
  websiteId?: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
}

export interface AIInteraction {
  id: string;
  userQuery: string;
  aiResponse: string;
  actionType?: string;
  createdAt: string;
}

export interface AppData {
  clients: Client[];
  websites: Website[];
  credentials: Credential[];
  tasks: Task[];
  renewals: Renewal[];
}
