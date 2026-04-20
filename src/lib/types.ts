export interface Client {
  id: string;
  // ── Identity ──────────────────────────────────────────────────
  name: string;
  businessName: string;
  businessType?: string;  // 'LLC' | 'Sole Trader' | 'Partnership' | 'NGO' | 'Other'
  industry?: string;      // 'E-commerce' | 'Healthcare' | 'Finance' | etc.
  email?: string;
  phone?: string;
  preferredContact?: 'email' | 'phone' | 'whatsapp';
  country?: string;
  city?: string;
  location: string;       // backward-compat composite (city, country)
  avatarUrl?: string;
  notes?: string;
  // ── Business Setup ────────────────────────────────────────────
  status?: 'Active' | 'Prospect' | 'On Hold' | 'Inactive';
  accountManager?: string;
  tags?: string;          // stored as comma-separated string in DB
  currency?: string;      // default 'GHS'
  vatEnabled?: boolean;
  paymentTerms?: string;  // 'Due on Receipt' | 'Net 15' | 'Net 30' | 'Net 60'
  preferredPayment?: 'Bank Transfer' | 'Mobile Money' | 'Cash' | 'Card';
  // ── Timestamps ────────────────────────────────────────────────
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
  isRead: boolean;
  details: string;
}

export interface AppData {
  clients: Client[];
  websites: Website[];
  credentials: Credential[];
  tasks: Task[];
  reminders: Reminder[];
  payments: Payment[];
}
