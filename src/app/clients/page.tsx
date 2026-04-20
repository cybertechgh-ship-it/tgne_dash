"use client";

import React, { useState, useRef, useMemo } from 'react';
import Image from 'next/image';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useApp } from '@/lib/store';
import {
  Plus, Search, MapPin, Mail, Phone, Trash2, Globe, User,
  ArrowRight, Edit2, Check, X as XIcon, Upload, Building2,
  Tag, DollarSign, CreditCard, ChevronRight, ChevronLeft,
  Briefcase, Star, AlertTriangle, Clock, Banknote, Smartphone,
  Receipt, ToggleLeft, Users, Filter, BadgeCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Client } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESS_TYPES = ['LLC', 'Sole Trader', 'Partnership', 'Corporation', 'NGO', 'Startup', 'Other'];
const INDUSTRIES = ['E-commerce', 'Healthcare', 'Finance', 'Education', 'Real Estate', 'Technology', 'Media', 'Hospitality', 'Retail', 'Other'];
const PAYMENT_TERMS = ['Due on Receipt', 'Net 15', 'Net 30', 'Net 60'];
const CURRENCIES = ['GHS', 'USD', 'EUR', 'GBP', 'NGN'];
const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  'Active':   { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: BadgeCheck },
  'Prospect': { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',          icon: Star },
  'On Hold':  { color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',        icon: Clock },
  'Inactive': { color: 'bg-muted text-muted-foreground border-border',              icon: AlertTriangle },
};
const TAG_OPTIONS = ['VIP', 'High Value', 'Risky', 'New', 'Recurring', 'Priority'];

// ─── Blank form state ─────────────────────────────────────────────────────────

const blank = (): Partial<Client> => ({
  name: '', businessName: '', businessType: '', industry: '',
  email: '', phone: '', preferredContact: 'email',
  country: 'Ghana', city: '', avatarUrl: '', notes: '',
  status: 'Active', accountManager: '', tags: '',
  currency: 'GHS', vatEnabled: false,
  paymentTerms: 'Due on Receipt', preferredPayment: 'Mobile Money',
});

// ─── Tag chip helper ──────────────────────────────────────────────────────────

function TagChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];
  const toggle = (tag: string) => {
    const next = selected.includes(tag)
      ? selected.filter(t => t !== tag)
      : [...selected, tag];
    onChange(next.join(', '));
  };
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {TAG_OPTIONS.map(tag => (
        <button
          key={tag}
          type="button"
          onClick={() => toggle(tag)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold border transition-all',
            selected.includes(tag)
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-muted text-muted-foreground border-border hover:border-primary/50'
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHead({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="font-bold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { data, addClient, updateClient, deleteClient } = useApp();
  const { toast } = useToast();

  // Dialog / sheet state
  const [isAddOpen, setIsAddOpen]         = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing]         = useState(false);

  // Form state
  const [step, setStep]       = useState<1 | 2>(1);
  const [form, setForm]       = useState<Partial<Client>>(blank());
  const [editData, setEditData] = useState<Partial<Client>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const fileInputRef    = useRef<HTMLInputElement>(null);
  const editFileRef     = useRef<HTMLInputElement>(null);

  // ── Computed ──────────────────────────────────────────────────────────────

  const filteredClients = useMemo(() => {
    return data.clients.filter(c => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q ||
        c.name.toLowerCase().includes(q) ||
        c.businessName.toLowerCase().includes(q) ||
        (c.location ?? '').toLowerCase().includes(q) ||
        (c.industry ?? '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data.clients, searchTerm, statusFilter]);

  const getClientStats = (clientId: string) => {
    const sites     = data.websites.filter(w => w.clientId === clientId);
    const taskItems = data.tasks.filter(t => t.clientId === clientId);
    const unpaid    = data.payments.filter(p => p.clientId === clientId && p.status === 'PENDING').length;
    const revenue   = data.payments
      .filter(p => p.clientId === clientId && p.status === 'PAID')
      .reduce((s, p) => s + (p.amount ?? 0), 0);
    return { sitesCount: sites.length, tasksCount: taskItems.length, unpaid, revenue };
  };

  // ── Image upload ──────────────────────────────────────────────────────────

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, target: 'form' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Max 1 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setLogoPreview(b64);
      if (target === 'form') setForm(p => ({ ...p, avatarUrl: b64 }));
      else setEditData(p => ({ ...p, avatarUrl: b64 }));
    };
    reader.readAsDataURL(file);
  };

  // ── Form helpers ──────────────────────────────────────────────────────────

  const set = (key: keyof Client) => (val: string | boolean) =>
    setForm(p => ({ ...p, [key]: val }));

  const setE = (key: keyof Client) => (val: string | boolean) =>
    setEditData(p => ({ ...p, [key]: val }));

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const location = [form.city, form.country].filter(Boolean).join(', ');
    addClient({
      ...form,
      location,
      avatarUrl: form.avatarUrl || `https://picsum.photos/seed/${Math.random()}/600/400`,
    });
    setIsAddOpen(false);
    setForm(blank());
    setLogoPreview(null);
    setStep(1);
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const location = [editData.city ?? selectedClient.city, editData.country ?? selectedClient.country]
      .filter(Boolean).join(', ');
    updateClient(selectedClient.id, { ...editData, location });
    setSelectedClient({ ...selectedClient, ...editData, location } as Client);
    setIsEditing(false);
    setLogoPreview(null);
  };

  const startEditing = () => {
    if (!selectedClient) return;
    setEditData({ ...selectedClient });
    setLogoPreview(selectedClient.avatarUrl ?? null);
    setIsEditing(true);
  };

  // ── Image renderer ────────────────────────────────────────────────────────

  const ClientImg = ({ src, alt, className }: { src: string; alt: string; className?: string }) =>
    src.startsWith('data:')
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={src} alt={alt} className={cn('object-cover', className)} />
      : <Image src={src} alt={alt} fill className={cn('object-cover', className)} />;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Partners</h1>
            <p className="text-muted-foreground mt-2">
              {data.clients.length} client{data.clients.length !== 1 ? 's' : ''} — the core of your agency.
            </p>
          </div>

          <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); if (!o) { setForm(blank()); setLogoPreview(null); setStep(1); } }}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 premium-button bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Plus size={20} /> New Client
              </Button>
            </DialogTrigger>

            {/* ── Add Dialog ──────────────────────────────────────────────── */}
            <DialogContent className="w-[95vw] sm:max-w-[680px] max-h-[92vh] overflow-hidden flex flex-col p-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl font-bold">Initialize Partnership</DialogTitle>
                    <DialogDescription className="mt-1">
                      {step === 1 ? 'Step 1 of 2 — Client Identity' : 'Step 2 of 2 — Business Setup'}
                    </DialogDescription>
                  </div>
                  {/* Step indicator */}
                  <div className="flex items-center gap-2">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                      step === 1 ? 'bg-primary text-primary-foreground border-primary' : 'bg-emerald-500 text-white border-emerald-500')}>
                      {step === 1 ? '1' : <Check size={14} />}
                    </div>
                    <div className="w-8 h-0.5 bg-border" />
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all',
                      step === 2 ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border')}>
                      2
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleAddClient} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-5">

                  {/* ── STEP 1: Client Identity ──────────────────────────── */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <SectionHead icon={Building2} title="Business Information" subtitle="Core identity of this client" />

                      {/* Logo upload */}
                      <div className="flex items-center gap-5">
                        <div
                          className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/30 overflow-hidden cursor-pointer hover:border-primary transition-colors flex-shrink-0"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {logoPreview
                            ? <ClientImg src={logoPreview} alt="logo" className="absolute inset-0 w-full h-full" />
                            : <div className="flex flex-col items-center gap-1 text-muted-foreground"><Upload size={18} /><span className="text-[9px] font-bold uppercase">Logo</span></div>
                          }
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => handleFile(e, 'form')} />
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-semibold text-foreground">Company Logo</p>
                          <p className="text-xs text-muted-foreground">Square PNG or JPG, max 1 MB. Used on client cards and reports.</p>
                          {logoPreview && (
                            <button type="button" onClick={() => { setLogoPreview(null); setForm(p => ({ ...p, avatarUrl: '' })); }}
                              className="text-xs text-destructive hover:underline mt-1">Remove</button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Business Name <span className="text-destructive">*</span></Label>
                          <Input required value={form.businessName} onChange={e => set('businessName')(e.target.value)} placeholder="e.g. Kofi Brands Ltd" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Business Type</Label>
                          <Select value={form.businessType} onValueChange={set('businessType')}>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>{BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Industry</Label>
                          <Select value={form.industry} onValueChange={set('industry')}>
                            <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                            <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Client Status</Label>
                          <Select value={form.status} onValueChange={set('status')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.keys(STATUS_CONFIG).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />
                      <SectionHead icon={User} title="Primary Contact" subtitle="Who is the main decision maker?" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label>Full Name <span className="text-destructive">*</span></Label>
                          <Input required value={form.name} onChange={e => set('name')(e.target.value)} placeholder="e.g. Kofi Mensah" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Email</Label>
                          <Input type="email" value={form.email} onChange={e => set('email')(e.target.value)} placeholder="kofi@company.com" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Phone</Label>
                          <Input value={form.phone} onChange={e => set('phone')(e.target.value)} placeholder="+233 24 000 0000" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Preferred Contact</Label>
                          <Select value={form.preferredContact} onValueChange={set('preferredContact')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="phone">Phone Call</SelectItem>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Separator />
                      <SectionHead icon={MapPin} title="Location" subtitle="Where is this client based?" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>City</Label>
                          <Input value={form.city} onChange={e => set('city')(e.target.value)} placeholder="e.g. Accra" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Country</Label>
                          <Input value={form.country} onChange={e => set('country')(e.target.value)} placeholder="e.g. Ghana" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── STEP 2: Business Setup ───────────────────────────── */}
                  {step === 2 && (
                    <div className="space-y-6">
                      <SectionHead icon={DollarSign} title="Financial Configuration" subtitle="How billing works with this client" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>Default Currency</Label>
                          <Select value={form.currency} onValueChange={set('currency')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Payment Terms</Label>
                          <Select value={form.paymentTerms} onValueChange={set('paymentTerms')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{PAYMENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Preferred Payment Method</Label>
                          <Select value={form.preferredPayment} onValueChange={set('preferredPayment')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="Card">Card</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Account Manager</Label>
                          <Input value={form.accountManager} onChange={e => set('accountManager')(e.target.value)} placeholder="Team member name" />
                        </div>
                      </div>

                      {/* VAT Toggle */}
                      <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0">
                            <Receipt size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Ghana VAT (15%)</p>
                            <p className="text-xs text-muted-foreground">Applies VAT to all invoices for this client</p>
                          </div>
                        </div>
                        <Switch checked={!!form.vatEnabled} onCheckedChange={set('vatEnabled')} />
                      </div>

                      <Separator />
                      <SectionHead icon={Tag} title="Segmentation Tags" subtitle="Label this client for quick filtering" />
                      <TagChips value={form.tags ?? ''} onChange={set('tags')} />

                      <Separator />
                      <SectionHead icon={Building2} title="Client Vision & Notes" subtitle="Internal context about this partnership" />
                      <Textarea
                        rows={4}
                        value={form.notes}
                        onChange={e => set('notes')(e.target.value)}
                        placeholder="What are this client's goals? What makes this partnership unique? Any important context..."
                        className="resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* ── Footer buttons ──────────────────────────────────────── */}
                <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between gap-3">
                  {step === 1 ? (
                    <Button type="button" variant="outline" onClick={() => { setIsAddOpen(false); }}>
                      Cancel
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="gap-2">
                      <ChevronLeft size={16} /> Back
                    </Button>
                  )}
                  {step === 1 ? (
                    <Button
                      type="button"
                      className="gap-2 bg-primary text-primary-foreground"
                      disabled={!form.name || !form.businessName}
                      onClick={() => setStep(2)}
                    >
                      Next: Business Setup <ChevronRight size={16} />
                    </Button>
                  ) : (
                    <Button type="submit" className="gap-2 bg-primary text-primary-foreground">
                      <Check size={16} /> Initialize Partnership
                    </Button>
                  )}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* ── Search + Filter bar ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <Input
              placeholder="Search by name, business, industry or location..."
              className="pl-10 h-11 bg-background/50 border-muted"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            {(['All', 'Active', 'Prospect', 'On Hold', 'Inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Client Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client) => {
            const stats   = getClientStats(client.id);
            const status  = client.status ?? 'Active';
            const StatusIcon = STATUS_CONFIG[status]?.icon ?? BadgeCheck;
            const tags    = client.tags ? client.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

            return (
              <Card
                key={client.id}
                className="group relative overflow-hidden premium-card cursor-pointer hover:translate-y-[-3px] transition-all duration-300"
                onClick={() => setSelectedClient(client)}
              >
                {/* Hero image */}
                <div className="relative h-44 w-full overflow-hidden">
                  <ClientImg
                    src={client.avatarUrl || `https://picsum.photos/seed/${client.id}/600/400`}
                    alt={client.businessName}
                    className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="font-bold text-lg text-white drop-shadow-md leading-tight">{client.businessName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-white/80 font-medium mt-0.5">
                      <MapPin size={11} className="text-primary" />
                      {client.city ?? client.location ?? '—'}
                      {client.industry && <span className="text-white/50">· {client.industry}</span>}
                    </div>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    <span className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border backdrop-blur-sm', STATUS_CONFIG[status]?.color)}>
                      <StatusIcon size={10} />
                      {status}
                    </span>
                  </div>
                  {stats.unpaid > 0 && (
                    <div className="absolute top-3 left-3">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/80 text-white backdrop-blur-sm animate-pulse">
                        {stats.unpaid} unpaid
                      </span>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Contact row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground leading-tight">{client.name}</p>
                        <p className="text-[10px] text-muted-foreground">{client.currency ?? 'GHS'} · {client.paymentTerms ?? 'Due on Receipt'}</p>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sites</p>
                      <p className="text-base font-bold">{stats.sitesCount}</p>
                    </div>
                    <div className="text-center border-x">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tasks</p>
                      <p className="text-base font-bold">{stats.tasksCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revenue</p>
                      <p className="text-base font-bold text-emerald-600">{(stats.revenue).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-2xl">
              <Users size={40} className="opacity-20 mb-3" />
              <p className="font-semibold">No clients found</p>
              <p className="text-sm mt-1">Adjust your filters or add a new client</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Client Detail Sheet ──────────────────────────────────────────────── */}
      <Sheet open={!!selectedClient} onOpenChange={(o) => {
        if (!o) { setSelectedClient(null); setIsEditing(false); setLogoPreview(null); }
      }}>
        <SheetContent className="w-full sm:max-w-[620px] overflow-y-auto p-0">
          {selectedClient && (
            <>
              {/* Hero */}
              <div className="relative h-56 w-full overflow-hidden">
                <ClientImg
                  src={selectedClient.avatarUrl || `https://picsum.photos/seed/${selectedClient.id}/600/400`}
                  alt={selectedClient.businessName}
                  className="absolute inset-0 w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-transparent" />
                {!isEditing && (
                  <div className="absolute bottom-4 left-6">
                    <Badge className={cn('mb-2 backdrop-blur-sm border', STATUS_CONFIG[selectedClient.status ?? 'Active']?.color)}>
                      {selectedClient.status ?? 'Active'}
                    </Badge>
                    <h2 className="text-2xl font-bold text-white drop-shadow">{selectedClient.businessName}</h2>
                    {selectedClient.industry && (
                      <p className="text-sm text-white/70 mt-0.5">{selectedClient.businessType ?? ''} · {selectedClient.industry}</p>
                    )}
                  </div>
                )}
                {/* Action buttons top-right */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {!isEditing ? (
                    <>
                      <Button variant="secondary" size="icon" className="rounded-full backdrop-blur-sm bg-white/20 border-white/20 text-white hover:bg-white/40" onClick={startEditing}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="destructive" size="icon" className="rounded-full" onClick={() => { deleteClient(selectedClient.id); setSelectedClient(null); }}>
                        <Trash2 size={16} />
                      </Button>
                    </>
                  ) : (
                    <Button variant="secondary" size="icon" className="rounded-full backdrop-blur-sm bg-white/20 border-white/20 text-white" onClick={() => { setIsEditing(false); setLogoPreview(null); }}>
                      <XIcon size={16} />
                    </Button>
                  )}
                </div>
              </div>

              <div className="px-6 py-6 space-y-7">
                <SheetHeader className="sr-only">
                  <SheetTitle>{selectedClient.businessName}</SheetTitle>
                  <SheetDescription>Client details and management</SheetDescription>
                </SheetHeader>

                {/* ── EDIT FORM ─────────────────────────────────────────── */}
                {isEditing ? (
                  <form onSubmit={handleUpdateClient} className="space-y-6">
                    {/* Logo */}
                    <div className="flex items-center gap-4">
                      <div
                        className="relative w-16 h-16 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/30 overflow-hidden cursor-pointer hover:border-primary transition-colors"
                        onClick={() => editFileRef.current?.click()}
                      >
                        {logoPreview
                          ? <ClientImg src={logoPreview} alt="logo" className="absolute inset-0 w-full h-full" />
                          : <Upload size={16} className="text-muted-foreground" />}
                      </div>
                      <input type="file" ref={editFileRef} className="hidden" accept="image/*" onChange={e => handleFile(e, 'edit')} />
                      <div>
                        <p className="text-sm font-semibold">Update Logo</p>
                        <p className="text-xs text-muted-foreground">Square image, max 1 MB</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label>Business Name</Label><Input required value={editData.businessName} onChange={e => setE('businessName')(e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Business Type</Label>
                        <Select value={editData.businessType} onValueChange={setE('businessType')}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Industry</Label>
                        <Select value={editData.industry} onValueChange={setE('industry')}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Status</Label>
                        <Select value={editData.status} onValueChange={setE('status')}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.keys(STATUS_CONFIG).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Full Name</Label><Input required value={editData.name} onChange={e => setE('name')(e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={editData.email} onChange={e => setE('email')(e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Phone</Label><Input value={editData.phone} onChange={e => setE('phone')(e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Preferred Contact</Label>
                        <Select value={editData.preferredContact} onValueChange={setE('preferredContact')}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>City</Label><Input value={editData.city} onChange={e => setE('city')(e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Country</Label><Input value={editData.country} onChange={e => setE('country')(e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Currency</Label>
                        <Select value={editData.currency} onValueChange={setE('currency')}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Payment Terms</Label>
                        <Select value={editData.paymentTerms} onValueChange={setE('paymentTerms')}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{PAYMENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Preferred Payment</Label>
                        <Select value={editData.preferredPayment} onValueChange={setE('preferredPayment')}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Card">Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5"><Label>Account Manager</Label><Input value={editData.accountManager} onChange={e => setE('accountManager')(e.target.value)} /></div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/30">
                      <div>
                        <p className="text-sm font-semibold">Ghana VAT (15%)</p>
                        <p className="text-xs text-muted-foreground">Applied to all invoices</p>
                      </div>
                      <Switch checked={!!editData.vatEnabled} onCheckedChange={setE('vatEnabled')} />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Tags</Label>
                      <TagChips value={editData.tags ?? ''} onChange={setE('tags')} />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Notes</Label>
                      <Textarea rows={3} value={editData.notes} onChange={e => setE('notes')(e.target.value)} className="resize-none" />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button type="submit" className="flex-1 gap-2"><Check size={16} />Save Changes</Button>
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </form>

                ) : (
                  /* ── VIEW MODE ──────────────────────────────────────────── */
                  <>
                    {/* Contact */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Contact</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { icon: User,  label: selectedClient.name, sub: 'Lead Contact' },
                          { icon: MapPin,label: [selectedClient.city, selectedClient.country].filter(Boolean).join(', ') || selectedClient.location, sub: 'Location' },
                          { icon: Mail,  label: selectedClient.email, sub: 'Email', href: `mailto:${selectedClient.email}` },
                          { icon: Phone, label: selectedClient.phone, sub: 'Phone', href: `tel:${selectedClient.phone}` },
                        ].filter(i => i.label).map(({ icon: Icon, label, sub, href }) => (
                          <div key={sub} className={cn('flex items-center gap-3 p-3 rounded-xl border bg-card transition-all', href && 'hover:border-primary cursor-pointer group')}
                            onClick={href ? () => window.open(href) : undefined}>
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0"><Icon size={16} /></div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{label}</p>
                              <p className="text-[10px] text-muted-foreground">{sub}</p>
                            </div>
                            {href && <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary ml-auto flex-shrink-0" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Financial */}
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Financial</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { icon: Banknote,   label: selectedClient.currency ?? 'GHS',                        sub: 'Currency' },
                          { icon: Receipt,    label: selectedClient.paymentTerms ?? 'Due on Receipt',          sub: 'Payment Terms' },
                          { icon: Smartphone, label: selectedClient.preferredPayment ?? '—',                   sub: 'Preferred Method' },
                          { icon: CreditCard, label: selectedClient.vatEnabled ? 'VAT Enabled (15%)' : 'No VAT', sub: 'Tax' },
                          { icon: Users,      label: selectedClient.accountManager ?? 'Unassigned',            sub: 'Account Manager' },
                        ].map(({ icon: Icon, label, sub }) => (
                          <div key={sub} className="flex items-center gap-2.5 p-3 rounded-xl border bg-card">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0"><Icon size={15} /></div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{label}</p>
                              <p className="text-[10px] text-muted-foreground">{sub}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedClient.tags && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Tags</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedClient.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                              <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Websites */}
                    <Separator />
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                        Digital Properties ({data.websites.filter(w => w.clientId === selectedClient.id).length})
                      </p>
                      <div className="space-y-2">
                        {data.websites.filter(w => w.clientId === selectedClient.id).map(site => (
                          <div key={site.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
                            <div className="flex items-center gap-3">
                              <Globe size={15} className="text-primary" />
                              <div>
                                <p className="text-xs font-bold">{site.domainName}</p>
                                <p className="text-[10px] text-muted-foreground">{site.platform} · Expires {site.expiryDate ?? 'N/A'}</p>
                              </div>
                            </div>
                            <Badge className={site.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]' : 'bg-red-500/10 text-red-600 border-red-500/20 text-[10px]'}>
                              {site.paymentStatus}
                            </Badge>
                          </div>
                        ))}
                        {data.websites.filter(w => w.clientId === selectedClient.id).length === 0 && (
                          <p className="text-sm text-muted-foreground italic">No websites linked yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedClient.notes && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Vision & Notes</p>
                          <p className="text-sm text-foreground/80 leading-relaxed italic bg-accent/20 p-4 rounded-xl border border-primary/10">
                            "{selectedClient.notes}"
                          </p>
                        </div>
                      </>
                    )}

                    {/* Footer */}
                    <div className="pt-3 border-t flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>Client Since {new Date(selectedClient.createdAt).toLocaleDateString()}</span>
                      <span className="truncate max-w-[160px]">ID: {selectedClient.id}</span>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
